import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Empty } from "@/components/common";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputCls = "w-full px-3 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-sm";

export default function Warehouses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/warehouses").then((r) => setRows(r.data)).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openForm = (w) => { setEdit(w); setForm(w ? { name: w.name, address: w.address || "" } : { name: "", address: "" }); setOpen(true); };

  const save = async () => {
    if (!form.name) return toast.error("Nama gudang wajib diisi");
    setSaving(true);
    try {
      if (edit) await api.patch(`/warehouses/${edit.id}`, form);
      else await api.post("/warehouses", form);
      toast.success("Tersimpan");
      setOpen(false);
      load();
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try { await api.delete(`/warehouses/${del.id}`); toast.success("Dihapus"); setDel(null); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div>
      <PageTitle title="Gudang" subtitle="Kelola daftar gudang">
        <button data-testid="add-warehouse-btn" onClick={() => openForm(null)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Tambah Gudang
        </button>
      </PageTitle>

      {loading ? <div className="text-sm text-gray-400 p-6">Memuat…</div> : rows.length === 0 ? <Empty title="Belum ada gudang" /> : (
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100">
          {rows.map((w) => (
            <div key={w.id} data-testid={`warehouse-${w.id}`} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-medium text-gray-900">{w.name}</div>
                <div className="text-sm text-gray-500">{w.address || "—"}</div>
              </div>
              <div className="flex items-center gap-1">
                <button data-testid={`edit-warehouse-${w.id}`} onClick={() => openForm(w)} className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-brand"><Pencil className="w-4 h-4" /></button>
                <button data-testid={`delete-warehouse-${w.id}`} onClick={() => setDel(w)} className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{edit ? "Edit Gudang" : "Tambah Gudang"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Nama</label>
              <input data-testid="warehouse-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Alamat</label>
              <textarea data-testid="warehouse-address-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inputCls} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300">Batal</button>
            <button data-testid="warehouse-save-btn" onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-sm bg-brand text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Hapus gudang?" description={`"${del?.name}" akan dihapus.`} onConfirm={doDelete} />
    </div>
  );
}
