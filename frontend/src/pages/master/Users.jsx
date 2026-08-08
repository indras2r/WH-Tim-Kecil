import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Shield, User as UserIcon } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Empty, Chip } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const inputCls = "w-full px-3 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-sm";

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "staff" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/users").then((r) => setRows(r.data)).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.email || !form.full_name || !form.password) return toast.error("Semua field wajib diisi");
    setSaving(true);
    try {
      await api.post("/users", form);
      toast.success("Pengguna dibuat");
      setOpen(false);
      setForm({ email: "", full_name: "", password: "", role: "staff" });
      load();
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="Pengguna" subtitle="Kelola akun tim">
        <button data-testid="add-user-btn" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </PageTitle>

      {loading ? <div className="text-sm text-gray-400 p-6">Memuat…</div> : rows.length === 0 ? <Empty title="Belum ada pengguna" /> : (
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100">
          {rows.map((u) => (
            <div key={u.id} data-testid={`user-${u.id}`} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-sm bg-brand text-white flex items-center justify-center text-xs font-bold font-mono">
                  {(u.full_name || u.email).slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{u.full_name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-xs font-medium ${u.role === "admin" ? "bg-brand/10 text-brand border-brand/30" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {u.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />} {u.role}
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Tambah Pengguna</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Nama Lengkap</label>
              <input data-testid="user-name-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input data-testid="user-email-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Kata Sandi</label>
              <input data-testid="user-password-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Peran</label>
              <div className="flex gap-2">
                <Chip active={form.role === "staff"} onClick={() => setForm({ ...form, role: "staff" })}>Staff</Chip>
                <Chip active={form.role === "admin"} onClick={() => setForm({ ...form, role: "admin" })}>Admin</Chip>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300">Batal</button>
            <button data-testid="user-save-btn" onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-sm bg-brand text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
