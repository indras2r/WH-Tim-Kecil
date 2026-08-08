import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Package, Search } from "lucide-react";
import { api, apiError, API } from "@/lib/api";
import { PageTitle, BrandDot, StockBadge, Chip, Empty } from "@/components/common";
import ItemFormDialog from "@/components/ItemFormDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";

export default function Inventory() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(params.get("q") || "");
  const [wh, setWh] = useState("");
  const [br, setBr] = useState("");
  const [cat, setCat] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delItem, setDelItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [i, w, b, c] = await Promise.all([
        api.get("/items"),
        api.get("/warehouses"),
        api.get("/brands"),
        api.get("/categories"),
      ]);
      setItems(i.data);
      setWarehouses(w.data);
      setBrands(b.data);
      setCategories(c.data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setQ(params.get("q") || ""); }, [params]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((it) => {
      if (wh && it.warehouse_id !== wh) return false;
      if (br && it.brand_id !== br) return false;
      if (cat && it.category_id !== cat) return false;
      if (s && !`${it.name} ${it.sku} ${it.brand_name || ""}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [items, q, wh, br, cat]);

  const exportXlsx = async () => {
    try {
      const token = localStorage.getItem("eg_token");
      const res = await fetch(`${API}/export/inventory.xlsx`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventori.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel diunduh");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/items/${delItem.id}`);
      toast.success("Barang dihapus");
      setDelItem(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div>
      <PageTitle title="Inventori" subtitle={`${filtered.length} dari ${items.length} barang`}>
        {isAdmin && (
          <>
            <button
              data-testid="export-xlsx-btn"
              onClick={exportXlsx}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-gray-300 bg-white hover:border-gray-400 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button
              data-testid="add-item-btn"
              onClick={() => { setEditItem(null); setFormOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Tambah Barang
            </button>
          </>
        )}
      </PageTitle>

      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            data-testid="inventory-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, SKU, atau brand…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <FilterRow label="Gudang">
          <Chip active={!wh} onClick={() => setWh("")}>Semua</Chip>
          {warehouses.map((w) => (
            <Chip key={w.id} active={wh === w.id} onClick={() => setWh(w.id)}>{w.name}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="Brand">
          <Chip active={!br} onClick={() => setBr("")}>Semua</Chip>
          {brands.map((b) => (
            <Chip key={b.id} color={b.color} active={br === b.id} onClick={() => setBr(b.id)}>{b.name}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="Jenis">
          <Chip active={!cat} onClick={() => setCat("")}>Semua</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>
          ))}
        </FilterRow>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 p-6">Memuat…</div>
      ) : filtered.length === 0 ? (
        <Empty title="Tidak ada barang" hint="Ubah filter atau tambahkan barang baru" />
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <Th>Barang</Th>
                <Th>Brand</Th>
                <Th>Jenis</Th>
                <Th>SKU</Th>
                <Th>Gudang</Th>
                <Th className="text-right">Tersedia / Total</Th>
                <Th>Status</Th>
                {isAdmin && <Th className="text-right">Aksi</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((it) => (
                <tr
                  key={it.id}
                  data-testid={`item-row-${it.id}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/inventori/${it.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                        {it.photo ? (
                          <img src={it.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{it.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {it.brand_name ? (
                      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: it.brand_color }}>
                        <BrandDot color={it.brand_color} /> {it.brand_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{it.category_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{it.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{it.warehouse_name || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="font-semibold text-gray-900">{it.available_qty}</span>
                    <span className="text-gray-400"> / {it.total_qty}</span>
                  </td>
                  <td className="px-4 py-3"><StockBadge available={it.available_qty} total={it.total_qty} /></td>
                  {isAdmin && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          data-testid={`edit-item-${it.id}`}
                          onClick={() => { setEditItem(it); setFormOpen(true); }}
                          className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-brand"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          data-testid={`delete-item-${it.id}`}
                          onClick={() => setDelItem(it)}
                          className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editItem}
        warehouses={warehouses}
        brands={brands}
        categories={categories}
        onSaved={load}
      />
      <ConfirmDialog
        open={!!delItem}
        onOpenChange={(o) => !o && setDelItem(null)}
        title="Hapus barang?"
        description={`"${delItem?.name}" akan dihapus permanen.`}
        onConfirm={doDelete}
      />
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="overline text-gray-400 w-14 shrink-0">{label}</span>
      {children}
    </div>
  );
}
function Th({ children, className = "" }) {
  return <th className={`px-4 py-3 font-medium overline ${className}`}>{children}</th>;
}
