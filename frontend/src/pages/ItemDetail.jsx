import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Package } from "lucide-react";
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

  const load = async () => {
    try {
      const [it, w, b, c] = await Promise.all([
        api.get(`/items/${id}`),
        api.get("/warehouses"),
        api.get("/brands"),
        api.get("/categories"),
      ]);
      setItem(it.data);
      setRefs({ warehouses: w.data, brands: b.data, categories: c.data });
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  useEffect(() => { load(); }, [id]);

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
