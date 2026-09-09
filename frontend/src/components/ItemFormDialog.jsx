import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { api, apiError } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Chip } from "@/components/common";

export default function ItemFormDialog({ open, onOpenChange, item, warehouses, brands, categories, onSaved }) {
  const editing = !!item;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        item
          ? { ...item }
          : {
              name: "",
              sku: "",
              warehouse_id: warehouses[0]?.id || "",
              brand_id: brands[0]?.id || "",
              category_id: categories[0]?.id || "",
              total_qty: 0,
              photo: null,
              notes: "",
            }
      );
    }
  }, [open, item]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const options = {
      maxSizeMB: 0.1,         // Kompresi otomatis ke target ~100KB
      maxWidthOrHeight: 1024, // Resolusi ideal untuk foto katalog barang
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onload = () => {
        set("photo", reader.result);
        setCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      toast.error("Gagal memproses gambar");
      setCompressing(false);
    }
  };

  const submit = async () => {
    if (!form.name || !form.sku) return toast.error("Nama & SKU wajib diisi");
    if (!form.warehouse_id) return toast.error("Pilih gudang");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        warehouse_id: form.warehouse_id,
        brand_id: form.brand_id || null,
        category_id: form.category_id || null,
        total_qty: Number(form.total_qty) || 0,
        photo: form.photo || null,
        notes: form.notes || "",
      };
      if (editing) await api.patch(`/items/${item.id}`, payload);
      else await api.post("/items", payload);
      toast.success(editing ? "Barang diperbarui" : "Barang ditambahkan");
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? "Edit Barang" : "Tambah Barang"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-sm border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
              {form.photo ? (
                <img src={form.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <label
                data-testid="item-photo-input"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-sm border border-gray-300 hover:border-gray-400"
              >
                {compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                {compressing ? "Mengompresi..." : "Unggah Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={compressing} />
              </label>
              {form.photo && (
                <button onClick={() => set("photo", null)} className="p-2 text-gray-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <Field label="Nama Barang">
            <input
              data-testid="item-name-input"
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <input
                data-testid="item-sku-input"
                value={form.sku || ""}
                onChange={(e) => set("sku", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Total Qty">
              <input
                data-testid="item-qty-input"
                type="number"
                min="0"
                value={form.total_qty ?? 0}
                onChange={(e) => set("total_qty", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
          </div>

          <Field label="Gudang">
            <div className="flex flex-wrap gap-2">
              {warehouses.map((w) => (
                <Chip key={w.id} active={form.warehouse_id === w.id} onClick={() => set("warehouse_id", w.id)}>
                  {w.name}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Brand">
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Chip key={b.id} color={b.color} active={form.brand_id === b.id} onClick={() => set("brand_id", b.id)}>
                  {b.name}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Jenis">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip key={c.id} active={form.category_id === c.id} onClick={() => set("category_id", c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Catatan">
            <textarea
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </Field>
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300 hover:border-gray-400">
            Batal
          </button>
          <button
            data-testid="item-save-btn"
            onClick={submit}
            disabled={saving || compressing}
            className="px-4 py-2 text-sm rounded-sm bg-brand hover:bg-brand-hover text-white font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-sm";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
