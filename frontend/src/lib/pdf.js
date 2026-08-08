import QRCode from "qrcode";

export async function printSuratJalan(sj) {
  const svg = await QRCode.toString(sj.qr_token, { type: "svg", margin: 1, width: 150 });
  const rows = sj.items
    .map(
      (l) => `<tr>
        <td>${l.item_name}</td>
        <td class="mono">${l.sku}</td>
        <td class="c">${l.qty}</td>
        <td class="c">${l.returned_qty}</td>
        <td class="c">${l.damaged_qty}</td>
        <td class="c">${l.lost_qty}</td>
        <td class="c">${l.used_qty}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${sj.sj_number}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; color:#111827; margin:36px; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #002FA7; padding-bottom:16px; }
    .brand { font-size:26px; font-weight:800; letter-spacing:-0.5px; }
    .brand span { color:#002FA7; }
    .sub { color:#6B7280; font-size:12px; margin-top:2px; }
    .sjno { text-align:right; }
    .sjno .n { font-size:20px; font-weight:700; font-family:"Courier New",monospace; }
    .qr { margin-top:8px; }
    .qr svg { width:120px; height:120px; }
    .meta { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; margin:22px 0; font-size:13px; }
    .meta b { color:#6B7280; font-weight:600; display:inline-block; min-width:120px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; font-size:12px; }
    th,td { border:1px solid #D1D5DB; padding:7px 9px; text-align:left; }
    th { background:#F3F4F6; text-transform:uppercase; font-size:10px; letter-spacing:0.06em; }
    td.c, th.c { text-align:center; }
    .mono { font-family:"Courier New",monospace; }
    .sign { display:flex; justify-content:space-between; margin-top:64px; }
    .sign div { width:40%; text-align:center; }
    .line { border-top:1px solid #111827; margin-top:60px; padding-top:6px; font-size:12px; }
    .notes { margin-top:18px; font-size:12px; color:#4B5563; }
  </style></head>
  <body>
    <div class="head">
      <div>
        <div class="brand">Event<span>Gudang</span></div>
        <div class="sub">Surat Jalan / Delivery Note</div>
      </div>
      <div class="sjno">
        <div class="n">${sj.sj_number}</div>
        <div class="qr">${svg}</div>
      </div>
    </div>
    <div class="meta">
      <div><b>Gudang Sumber</b> ${sj.warehouse_name || "-"}</div>
      <div><b>Penerima</b> ${sj.recipient_name || "-"}</div>
      <div><b>Event</b> ${sj.event_name || "-"}</div>
      <div><b>Tanggal Event</b> ${sj.event_date || "-"}</div>
      <div><b>Dibuat oleh</b> ${sj.created_by_name || "-"}</div>
      <div><b>Status</b> ${sj.status}</div>
    </div>
    <table>
      <thead><tr>
        <th>Barang</th><th>SKU</th><th class="c">Qty</th><th class="c">Kembali</th>
        <th class="c">Rusak</th><th class="c">Hilang</th><th class="c">Terpakai</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${sj.notes ? `<div class="notes"><b>Catatan:</b> ${sj.notes}</div>` : ""}
    <div class="sign">
      <div><div class="line">Petugas Gudang</div></div>
      <div><div class="line">Penerima</div></div>
    </div>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}
