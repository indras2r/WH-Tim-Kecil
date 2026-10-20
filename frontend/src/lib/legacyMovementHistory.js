// Compatibility layer for Render deployments that predate the movement API.
// Reads existing receipt and delivery documents without changing stock.
export const legacyHistoryNotice =
  "Riwayat sementara berasal dari daftar Penerimaan dan Surat Jalan (maks. 1.000 dokumen terbaru per jenis). " +
  "Stok awal, edit stok manual, serta tanggal tiap retur parsial tidak tersedia dalam dokumen lama. " +
  "Saldo historis tidak direkonstruksi.";

const qty = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export function readLegacyHistory(itemId, receipts, deliveries) {
  const rows = [];
  for (const doc of receipts || []) {
    (doc.items || []).forEach((line, i) => {
      if (line.item_id !== itemId || qty(line.qty) <= 0) return;
      rows.push({
        id: ["pbk", doc.id, itemId, i].join(":"), type: "IN", qty: qty(line.qty),
        date: doc.created_at || null, document_number: doc.receipt_number || "",
        document_id: doc.id, document_type: "penerimaan", event_name: "",
        party: doc.supplier_name || "", actor: doc.created_by_name || "", note: doc.notes || "",
        description: line.is_new ? "Penerimaan barang baru" : "Penerimaan barang"
      });
    });
  }
  for (const doc of deliveries || []) {
    (doc.items || []).forEach((line, i) => {
      if (line.item_id !== itemId) return;
      const common = {
        document_number: doc.sj_number || "", document_id: doc.id, document_type: "surat-jalan",
        event_name: doc.event_name || "", party: doc.recipient_name || "",
        actor: doc.created_by_name || "", note: doc.notes || ""
      };
      if (qty(line.qty) > 0) rows.push({
        ...common, id: ["sj", doc.id, itemId, i, "out"].join(":"),
        type: "OUT", qty: -qty(line.qty), date: doc.created_at || null,
        description: "Barang keluar"
      });
      for (const [field, type, label, increasesAvailable] of [
        ["returned_qty", "RETURN", "Kembali tersedia", true],
        ["damaged_qty", "DAMAGED", "Dikembalikan rusak", false],
        ["lost_qty", "LOST", "Barang hilang", false],
        ["used_qty", "USED", "Barang terpakai", false]
      ]) {
        const amount = qty(line[field]);
        if (amount <= 0) continue;
        rows.push({
          ...common, id: ["sj", doc.id, itemId, i, field].join(":"),
          type, qty: increasesAvailable ? amount : 0, processed_qty: amount,
          date: null, description: label,
          date_note: "Waktu transaksi ini tidak dicatat secara individual pada data lama"
        });
      }
    });
  }
  return rows.sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id));
}

const xml = v => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const safeCell = v => {
  const s = String(v == null ? "" : v);
  return /^\s*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s) ? "'" + s : s;
};
const column = n => {
  let out = "";
  for (n++; n; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out;
  return out;
};
const write16 = (d, pos, v) => d.setUint16(pos, v, true);
const write32 = (d, pos, v) => d.setUint32(pos, v >>> 0, true);
function checksum(bytes) {
  let value = -1;
  for (const byte of bytes) {
    value ^= byte;
    for (let i = 0; i < 8; i++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ -1) >>> 0;
}
function xlsxZip(files) {
  const enc = new TextEncoder(), content = [], entries = [];
  let offset = 0;
  for (const [path, source] of Object.entries(files)) {
    const name = enc.encode(path), bytes = enc.encode(source), crc = checksum(bytes);
    const local = new Uint8Array(30 + name.length), a = new DataView(local.buffer);
    write32(a, 0, 0x04034b50); write16(a, 4, 20);
    write32(a, 14, crc); write32(a, 18, bytes.length); write32(a, 22, bytes.length);
    write16(a, 26, name.length); local.set(name, 30);
    content.push(local, bytes);
    const central = new Uint8Array(46 + name.length), b = new DataView(central.buffer);
    write32(b, 0, 0x02014b50); write16(b, 4, 20); write16(b, 6, 20);
    write32(b, 16, crc); write32(b, 20, bytes.length); write32(b, 24, bytes.length);
    write16(b, 28, name.length); write32(b, 42, offset); central.set(name, 46);
    entries.push(central); offset += local.length + bytes.length;
  }
  const eocd = new Uint8Array(22), d = new DataView(eocd.buffer);
  write32(d, 0, 0x06054b50); write16(d, 8, entries.length); write16(d, 10, entries.length);
  write32(d, 12, entries.reduce((n, v) => n + v.length, 0)); write32(d, 16, offset);
  return new Blob([...content, ...entries, eocd], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
const labels = {
  IN: "Barang masuk", OUT: "Barang keluar", RETURN: "Kembali tersedia",
  DAMAGED: "Barang rusak", LOST: "Barang hilang", USED: "Barang terpakai"
};
/** Generates a genuine XLSX from the visible filtered records; no server write and no dependencies. */
export function legacyExcel(item, movements, type, search, note) {
  const rows = [
    ["RIWAYAT MUTASI INVENTORI — TIM KECIL"],
    ["Nama barang", item?.name || ""],
    ["SKU", item?.sku || ""],
    ["Filter", type === "ALL" ? "Semua mutasi" : labels[type] || type],
    ["Pencarian", search || "Semua"],
    ["Jumlah transaksi", movements.length],
    ["Keterangan", note || legacyHistoryNotice],
    ["Tanggal", "Jenis mutasi", "Perubahan stok", "Jumlah diproses", "Nomor dokumen", "Event", "Pihak", "Petugas", "Catatan", "Info tanggal"],
    ...movements.map(m => [
      m.date ? new Date(m.date).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) : "Tidak tercatat",
      m.description || labels[m.type] || m.type,
      qty(m.qty), qty(m.processed_qty ?? Math.abs(qty(m.qty))),
      m.document_number || "", m.event_name || "", m.party || "", m.actor || "",
      m.note || "", m.date_note || ""
    ])
  ];
  const data = rows.map((row, i) => {
    const cells = row.map((val, col) => {
      const ref = column(col) + (i + 1), style = i === 7 ? ' s="1"' : "";
      return typeof val === "number" && Number.isFinite(val)
        ? '<c r="' + ref + '"' + style + '><v>' + val + '</v></c>'
        : '<c r="' + ref + '" t="inlineStr"' + style + '><is><t xml:space="preserve">' + xml(safeCell(val)) + '</t></is></c>';
    }).join("");
    return '<row r="' + (i + 1) + '">' + cells + '</row>';
  }).join("");
  const columns = [24, 28, 19, 20, 27, 31, 27, 27, 36, 42].map((w, i) =>
    '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'
  ).join("");
  const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    '<cols>' + columns + '</cols><sheetData>' + data + '</sheetData>' +
    '<autoFilter ref="A8:J' + Math.max(8, rows.length) + '"/></worksheet>';
  const files = {
    "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    "_rels/.rels": '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Riwayat Mutasi" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "xl/styles.xml": '<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF002FA7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>',
    "xl/worksheets/sheet1.xml": sheet
  };
  return xlsxZip(files);
}
