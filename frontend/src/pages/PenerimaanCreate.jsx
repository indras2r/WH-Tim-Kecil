import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, Boxes, PackagePlus, Search } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Chip, BrandDot } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function PenerimaanCreate() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wh, setWh] = useState("");
  const [form, setForm] = useState({ supplier_name: "", receipt_date: "", notes: "" });
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [existOpen, setExistOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/warehouses"), api.get("/brands"), api.get("/categories")]).then(([w, b, c]) => {
      setWarehouses(w.data);
      setBrands(b.data);
      setCategories(c.data);
      if (w.data[0]) setWh(w.data[0].id);
    });
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addLine = (line) => setLines((l) => [...l, line]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!wh) return toast.error("Pilih gudang");
    if (!form.supplier_name) return toast.error("Nama supplier wajib diisi");
    if (!lines.length) return toast.error("Tambah minimal satu barang");
    setSaving(true);
    try {
      const payload = {
        warehouse_id: wh,
        ...form,
        items: lines.map((l) =>
          l.mode === "existing"
            ? { mode: "existing", item_id: l.item_id, qty: l.qty }
            : { mode: "new", name: l.name, sku: l.sku, brand_id: l.brand_id, category_id: l.category_id, qty: l.qty }
        ),
      };
      const { data } = await api.post("/penerimaan", payload);
      toast.success(`Penerimaan ${data.receipt_number} dibuat`);
      navigate(`/penerimaan/${data.id}`);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>
      <PageTitle title="Terima Barang" subtitle="Catat barang masuk ke gudang" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-sm p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Gudang Tujuan</label>
              <div className="flex flex-wrap gap-2">
                {warehouses.map((w) => (
                  <Chip key={w.id} active={wh === w.id} onClick={() => setWh(w.id)}>{w.name}</Chip>
                ))}
              </div>
            </div>
            <Field label="Nama Supplier">
              <input data-testid="pb-supplier" value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tanggal Terima">
              <input data-testid="pb-date" type="date" value={form.receipt_date} onChange={(e) => set("receipt_date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Catatan">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} />
            </Field>
          </div>
          <button
            data-testid="pb-submit"
            onClick={submit}
            disabled={saving}
            className="w-full py-2.5 rounded-sm bg-brand hover:bg-brand-hover text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Penerimaan
          </button>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2">
            <button
              data-testid="pb-add-existing"
              onClick={() => setExistOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-gray-300 hover:border-gray-400 text-sm font-medium"
            >
              <Boxes className="w-4 h-4" /> Stok Barang Lama
            </button>
            <button
              data-testid="pb-add-new"
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-brand/40 bg-brand/5 text-brand hover:bg-brand/10 text-sm font-medium"
            >
              <PackagePlus className="w-4 h-4" /> Barang Baru
            </button>
          </div>
          <div className="divide-y divide-gray-100 min-h-[200px]">
            {lines.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">Belum ada barang. Tambahkan dari tombol di atas.</div>
            ) : (
              lines.map((l, i) => (
                <div key={i} data-testid={`pb-line-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {l.name}
                      {l.mode === "new" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-brand/30 bg-brand/10 text-brand font-medium">BARU</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{l.sku}</div>
                  </div>
                  <span className="font-mono font-semibold">+{l.qty}</span>
                  <button onClick={() => removeLine(i)} className="p-1.5 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ExistingModal open={existOpen} onOpenChange={setExistOpen} wh={wh} onAdd={addLine} />
      <NewItemModal open={newOpen} onOpenChange={setNewOpen} brands={brands} categories={categories} onAdd={addLine} />
    </div>
  );
}

function ExistingModal({ open, onOpenChange, wh, onAdd }) {
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const [qty, setQty] = useState(1);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open && wh) {
      api.get(`/items?warehouse_id=${wh}`).then((r) => setItems(r.data));
      setSel(null);
      setQty(1);
      setQ("");
    }
  }, [open, wh]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((it) => !s || `${it.name} ${it.sku}`.toLowerCase().includes(s));
  }, [items, q]);

  const add = () => {
    if (!sel) return toast.error("Pilih barang");
    if (qty <= 0) return toast.error("Qty harus lebih dari 0");
    onAdd({ mode: "existing", item_id: sel.id, name: sel.name, sku: sel.sku, qty: Number(qty) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Pilih Barang Lama</DialogTitle></DialogHeader>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari barang…" className={`${inputCls} pl-9`} />
        </div>
        <div className="border border-gray-200 rounded-sm divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {filtered.map((it) => (
            <button
              key={it.id}
              data-testid={`pb-exist-${it.id}`}
              onClick={() => setSel(it)}
              className={`w-full text-left px-3 py-2.5 flex justify-between items-center hover:bg-gray-50 ${sel?.id === it.id ? "bg-brand/5" : ""}`}
            >
              <span>
                <span className="font-medium text-gray-900">{it.name}</span>
                <span className="block text-xs text-gray-500 font-mono">{it.sku}</span>
              </span>
              {sel?.id === it.id && <span className="text-brand text-xs font-medium">Dipilih</span>}
            </button>
          ))}
        </div>
        <Field label="Jumlah Diterima">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={`${inputCls} font-mono`} data-testid="pb-exist-qty" />
        </Field>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300">Batal</button>
          <button onClick={add} data-testid="pb-exist-add" className="px-4 py-2 text-sm rounded-sm bg-brand text-white font-medium">Tambah</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewItemModal({ open, onOpenChange, brands, categories, onAdd }) {
  const [f, setF] = useState({ name: "", sku: "", brand_id: "", category_id: "", qty: 1 });

  useEffect(() => {
    if (open) setF({ name: "", sku: "", brand_id: brands[0]?.id || "", category_id: categories[0]?.id || "", qty: 1 });
  }, [open]); // eslint-disable-line

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const add = () => {
    if (!f.name || !f.sku) return toast.error("Nama & SKU wajib diisi");
    if (f.qty <= 0) return toast.error("Qty harus lebih dari 0");
    onAdd({ mode: "new", name: f.name, sku: f.sku, brand_id: f.brand_id || null, category_id: f.category_id || null, qty: Number(f.qty) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Barang Baru</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Nama Barang"><input data-testid="pb-new-name" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU"><input data-testid="pb-new-sku" value={f.sku} onChange={(e) => set("sku", e.target.value)} className={`${inputCls} font-mono`} /></Field>
            <Field label="Jumlah"><input data-testid="pb-new-qty" type="number" min="1" value={f.qty} onChange={(e) => set("qty", e.target.value)} className={`${inputCls} font-mono`} /></Field>
          </div>
          <Field label="Brand">
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Chip key={b.id} color={b.color} active={f.brand_id === b.id} onClick={() => set("brand_id", b.id)}>{b.name}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Jenis">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip key={c.id} active={f.category_id === c.id} onClick={() => set("category_id", c.id)}>{c.name}</Chip>
              ))}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300">Batal</button>
          <button onClick={add} data-testid="pb-new-add" className="px-4 py-2 text-sm rounded-sm bg-brand text-white font-medium">Tambah</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = "w-full px-3 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-sm";
function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
