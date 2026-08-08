import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Empty, BrandDot } from "@/components/common";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputCls = "w-full px-3 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-sm";
const PALETTE = ["#EF4444", "#F97316", "#F59E0B", "#84CC16", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#D946EF", "#F43F5E"];

export default function Brands() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", color: PALETTE[6], note: "" });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/brands").then((r) => setRows(r.data)).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openForm = (b) => { setEdit(b); setForm(b ? { name: b.name, color: b.color, note: b.note || "" } : { name: "", color: PALETTE[6], note: "" }); setOpen(true); };

  const save = async () => {
    if (!form.name) return toast.error("Nama brand wajib diisi");
    setSaving(true);
    try {
      if (edit) await api.patch(`/brands/${edit.id}`, form);
      else await api.post("/brands", form);
      toast.success("Tersimpan");
      setOpen(false);
      load();
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try { await api.delete(`/brands/${del.id}`); toast.success("Dihapus"); setDel(null); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div>
      <PageTitle title="Brand" subtitle="Kelola brand & warna label">
        <button data-testid="add-brand-btn" onClick={() => openForm(null)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Tambah Brand
        </button>
      </PageTitle>

      {loading ? <div className="text-sm text-gray-400 p-6">Memuat…</div> : rows.length === 0 ? <Empty title="Belum ada brand" /> : (
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100">
          {rows.map((b) => (
            <div key={b.id} data-testid={`brand-${b.id}`} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-sm border border-black/10" style={{ backgroundColor: b.color }} />
                <div>
                  <div className="font-medium" style={{ color: b.color }}>{b.name}</div>
                  <div className="text-sm text-gray-500">{b.note || <span className="font-mono text-xs">{b.color}</span>}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button data-testid={`edit-brand-${b.id}`} onClick={() => openForm(b)} className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-brand"><Pencil className="w-4 h-4" /></button>
                <button data-testid={`delete-brand-${b.id}`} onClick={() => setDel(b)} className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{edit ? "Edit Brand" : "Tambah Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Nama</label>
              <input data-testid="brand-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Warna</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    data-testid={`brand-color-${c}`}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-sm border-2 transition-transform ${form.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input data-testid="brand-hex-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={`${inputCls} font-mono`} placeholder="#3B82F6" />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border" style={{ borderColor: form.color, color: form.color }}>
                  <BrandDot color={form.color} /> {form.name || "Brand"}
                </span>
              </div>
            </div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Catatan</label>
              <input data-testid="brand-note-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300">Batal</button>
            <button data-testid="brand-save-btn" onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-sm bg-brand text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Hapus brand?" description={`"${del?.name}" akan dihapus. Tidak bisa jika masih dipakai barang.`} onConfirm={doDelete} />
    </div>
  );
}
