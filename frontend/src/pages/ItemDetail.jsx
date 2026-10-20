import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Package, History, Download, Search } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { BrandDot } from "@/components/common";
import ItemFormDialog from "@/components/ItemFormDialog";
import { useAuth } from "@/context/AuthContext";

const STATS = [
  { key: "total_qty", label: "Total", tone: "text-gray-900" },
  { key: "available_qty", label: "Tersedia", tone: "text-emerald-600" },
  { key: "keluar", label: "Keluar", tone: "text-amber-600" },
  { key: "damaged_qty", label: "Rusak", tone: "text-orange-600" },
  { key: "lost_qty", label: "Hilang", tone: "text-red-600" },
  { key: "used_qty", label: "Terpakai", tone: "text-violet-600" },
];

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [item, setItem] = useState(null);
  const [refs, setRefs] = useState({ warehouses: [], brands: [], categories: [] });
  const [editOpen, setEditOpen] = useState(false);
  const [movements, setMovements] = useState([]);
  const [movementNotice, setMovementNotice] = useState("");
  const [movementLoading, setMovementLoading] = useState(true);
  const [movementError, setMovementError] = useState("");
  const [movementType, setMovementType] = useState("ALL");
  const [movementSearch, setMovementSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    try {
      const [it, w, b, c] = await Promise.all([
        api.get(`/items/${id}`),
        api.get("/warehouses"),
        api.get("/brands"),
        api.get("/categories"),
      ]);
      const brand = b.data.find((x) => x.id === it.data.brand_id);
      const wh = w.data.find((x) => x.id === it.data.warehouse_id);
      const cat = c.data.find((x) => x.id === it.data.category_id);
      setItem({
        ...it.data,
        brand_name: brand?.name || null,
        brand_color: brand?.color || null,
        category_name: cat?.name || null,
        warehouse_name: wh?.name || null,
      });
      setRefs({ warehouses: w.data, brands: b.data, categories: c.data });
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    let active = true;
    setMovementLoading(true);
    setMovementError("");
    api.get(`/items/${id}/movements`).then(({ data }) => {
      if (active) {
        setMovements(data.movements || []);
        setMovementNotice(data.notice || "");
      }
    }).catch((e) => { if (active) setMovementError(apiError(e)); })
      .finally(() => { if (active) setMovementLoading(false); });
    return () => { active = false; };
  }, [id]);

  const filteredMovements = movements.filter((m) => {
    if (movementType !== "ALL" && m.type !== movementType) return false;
    const text = [m.description, m.document_number, m.event_name, m.party, m.actor, m.note]
      .filter(Boolean).join(" ").toLocaleLowerCase("id-ID");
    return text.includes(movementSearch.trim().toLocaleLowerCase("id-ID"));
  });

  const exportMovements = async () => {
    if (exporting || movementLoading || movementError || !filteredMovements.length) return;
    setExporting(true);
    try {
      const response = await api.get(`/items/${id}/movements.xlsx`, {
        params: { movement_type: movementType, search: movementSearch.trim() },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const filename = `riwayat-mutasi-${(item?.sku || "item").replace(/[^a-zA-Z0-9_-]/g, "-")}.xlsx`;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${filteredMovements.length} transaksi diekspor ke Excel`);
    } catch (error) {
      toast.error("Export Excel gagal. Periksa koneksi atau endpoint backend.");
    } finally {
      setExporting(false);
    }
  };

  if (!item) return <div className="text-sm text-gray-400">Memuat…</div>;

  const keluar = Math.max(0, item.total_qty - item.available_qty);
  const val = (k) => (k === "keluar" ? keluar : item[k]);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <div className="aspect-square rounded-sm border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
            {item.photo ? (
              <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-12 h-12 text-gray-300" />
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-4">{item.name}</h1>
          <div className="font-mono text-sm text-gray-500 mt-1">{item.sku}</div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Brand">
              {item.brand_name ? (
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: item.brand_color }}>
                  <BrandDot color={item.brand_color} /> {item.brand_name}
                </span>
              ) : "—"}
            </Row>
            <Row label="Jenis">{item.category_name || "—"}</Row>
            <Row label="Gudang">{item.warehouse_name || "—"}</Row>
            {item.notes && <Row label="Catatan">{item.notes}</Row>}
          </div>
          {isAdmin && (
            <button
              data-testid="detail-edit-btn"
              onClick={() => setEditOpen(true)}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium"
            >
              <Pencil className="w-4 h-4" /> Edit Barang
            </button>
          )}
        </div>

        <div className="lg:col-span-2">
          <p className="overline text-gray-400 mb-3">Statistik Stok</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.key} data-testid={`stat-${s.key}`} className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="overline text-gray-400">{s.label}</div>
                <div className={`font-display text-3xl font-bold font-mono mt-2 ${s.tone}`}>{val(s.key)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-6 bg-white border border-gray-200 rounded-sm p-5" data-testid="item-movement-history">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" /> Riwayat Mutasi Barang
            </h2>
            <p className="text-xs text-gray-500 mt-1">{filteredMovements.length} dari {movements.length} transaksi ditampilkan</p>
          </div>
          <button
            type="button"
            data-testid="export-item-movements"
            disabled={exporting || movementLoading || !!movementError || filteredMovements.length === 0}
            onClick={exportMovements}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> {exporting ? "Menyiapkan Excel…" : "Export Excel"}
          </button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <select
            aria-label="Filter jenis mutasi"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="border border-gray-200 bg-white rounded-sm px-3 py-2 text-sm"
          >
            <option value="ALL">Semua mutasi</option>
            <option value="IN">Barang masuk</option>
            <option value="OUT">Barang keluar</option>
            <option value="RETURN">Kembali tersedia</option>
            <option value="DAMAGED">Barang rusak</option>
            <option value="LOST">Barang hilang</option>
            <option value="USED">Barang terpakai</option>
          </select>
          <label className="flex items-center gap-2 border border-gray-200 rounded-sm px-3 py-2 flex-1 text-gray-400">
            <Search className="w-4 h-4" />
            <input
              aria-label="Cari histori mutasi"
              value={movementSearch}
              onChange={(e) => setMovementSearch(e.target.value)}
              placeholder="Cari dokumen, event, petugas…"
              className="outline-none w-full text-gray-800 text-sm min-w-0"
            />
          </label>
        </div>
        {movementNotice && <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-sm">{movementNotice}</p>}
        {movementLoading ? <p className="mt-4 text-sm text-gray-500">Memuat histori…</p> :
          movementError ? <p className="mt-4 text-sm text-red-600">{movementError}</p> :
          movements.length === 0 ? <p className="mt-4 text-sm text-gray-500">Belum ada dokumen transaksi untuk barang ini.</p> :
          filteredMovements.length === 0 ? <p className="mt-4 text-sm text-gray-500">Tidak ada transaksi sesuai filter.</p> :
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500"><tr>
                <th className="p-3">Tanggal tercatat</th><th className="p-3">Jenis mutasi</th>
                <th className="p-3">Jumlah</th><th className="p-3">Dokumen</th>
                <th className="p-3">Event / Pihak</th><th className="p-3">Petugas</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.map((m) => <tr key={m.id}>
                  <td className="p-3 whitespace-nowrap" title={m.date_note || ""}>
                    {m.date ? new Date(m.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Tidak tercatat"}
                  </td>
                  <td className="p-3">{m.description}</td>
                  <td className={`p-3 font-mono font-semibold ${m.qty > 0 ? "text-emerald-700" : m.qty < 0 ? "text-red-600" : "text-gray-600"}`}>
                    {m.qty > 0 ? "+" : ""}{m.qty || (m.processed_qty ? `${m.processed_qty} diproses` : "0")}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {m.document_id ? <Link className="text-blue-700 underline" to={`/${m.document_type}/${m.document_id}`}>{m.document_number || "Lihat dokumen"}</Link> : "—"}
                  </td>
                  <td className="p-3">{m.event_name || m.party || "—"}</td>
                  <td className="p-3">{m.actor || "—"}</td>
                </tr>)}
              </tbody>
            </table>
          </div>}
      </section>

      <ItemFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={item}
        warehouses={refs.warehouses}
        brands={refs.brands}
        categories={refs.categories}
        onSaved={load}
      />
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 text-right">{children}</span>
    </div>
  );
}
