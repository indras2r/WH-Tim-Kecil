import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Empty } from "@/components/common";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputCls = "w-full px-3 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-sm";

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/categories").then((r) => setRows(r.data)).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openForm = (c) => { setEdit(c); setName(c ? c.name : ""); setOpen(true); };

  const save = async () => {
    if (!name) return toast.error("Nama jenis wajib diisi");
    setSaving(true);
    try {
      if (edit) await api.patch(`/categories/${edit.id}`, { name });
      else await api.post("/categories", { name });
      toast.success("Tersimpan");
      setOpen(false);
      load();
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try { await api.delete(`/categories/${del.id}`); toast.success("Dihapus"); setDel(null); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div>
      <PageTitle title="Jenis" subtitle="Kelola kategori barang">
        <button data-testid="add-category-btn" onClick={() => openForm(null)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Tambah Jenis
        </button>
      </PageTitle>

      {loading ? <div className="text-sm text-gray-400 p-6">Memuat…</div> : rows.length === 0 ? <Empty title="Belum ada jenis" /> : (
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100">
          {rows.map((c) => (
            <div key={c.id} data-testid={`category-${c.id}`} className="flex items-center justify-between px-5 py-4">
              <div className="font-medium text-gray-900">{c.name}</div>
              <div className="flex items-center gap-1">
                <button data-testid={`edit-category-${c.id}`} onClick={() => openForm(c)} className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-brand"><Pencil className="w-4 h-4" /></button>
                <button data-testid={`delete-category-${c.id}`} onClick={() => setDel(c)} className="p-1.5 rounded-sm hover:bg-gray-100 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{edit ? "Edit Jenis" : "Tambah Jenis"}</DialogTitle></DialogHeader>
          <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Nama Jenis</label>
            <input data-testid="category-name-input" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Tools / Merchandise / Produk" /></div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300">Batal</button>
            <button data-testid="category-save-btn" onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-sm bg-brand text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Hapus jenis?" description={`"${del?.name}" akan dihapus.`} onConfirm={doDelete} />
    </div>
  );
}
