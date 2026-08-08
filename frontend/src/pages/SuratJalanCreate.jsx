import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Loader2, Search } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Chip, BrandDot } from "@/components/common";

export default function SuratJalanCreate() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [wh, setWh] = useState("");
  const [form, setForm] = useState({ recipient_name: "", event_name: "", event_date: "", notes: "" });
  const [qty, setQty] = useState({});
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/warehouses").then((r) => {
      setWarehouses(r.data);
      if (r.data[0]) setWh(r.data[0].id);
    });
  }, []);
  useEffect(() => {
    if (!wh) return;
    setQty({});
    api.get(`/items?warehouse_id=${wh}`).then((r) => setItems(r.data));
  }, [wh]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItemQty = (id, delta, max) =>
    setQty((s) => {
      const next = Math.max(0, Math.min(max, (s[id] || 0) + delta));
      return { ...s, [id]: next };
    });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((it) => !s || `${it.name} ${it.sku}`.toLowerCase().includes(s));
  }, [items, q]);

  const selectedCount = Object.values(qty).filter((v) => v > 0).length;

  const submit = async () => {
    if (!wh) return toast.error("Pilih gudang");
    if (!form.recipient_name || !form.event_name) return toast.error("Penerima & nama event wajib diisi");
    const lines = Object.entries(qty).filter(([, v]) => v > 0).map(([item_id, v]) => ({ item_id, qty: v }));
    if (!lines.length) return toast.error("Pilih minimal satu barang");
    setSaving(true);
    try {
      const { data } = await api.post("/surat-jalan", { warehouse_id: wh, ...form, items: lines });
      toast.success(`Surat jalan ${data.sj_number} dibuat`);
      navigate(`/surat-jalan/${data.id}`);
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
      <PageTitle title="Buat Surat Jalan" subtitle="Keluarkan barang untuk event" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-sm p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Gudang Sumber</label>
              <div className="flex flex-wrap gap-2">
                {warehouses.map((w) => (
                  <Chip key={w.id} active={wh === w.id} onClick={() => setWh(w.id)} testid={`sj-wh-${w.id}`}>{w.name}</Chip>
                ))}
              </div>
            </div>
            <Field label="Nama Penerima">
              <input data-testid="sj-recipient" value={form.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nama Event">
              <input data-testid="sj-event" value={form.event_name} onChange={(e) => set("event_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tanggal Event">
              <input data-testid="sj-date" type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Catatan">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} />
            </Field>
          </div>
          <button
            data-testid="sj-submit"
            onClick={submit}
            disabled={saving}
            className="w-full py-2.5 rounded-sm bg-brand hover:bg-brand-hover text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Buat Surat Jalan ({selectedCount})
          </button>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                data-testid="sj-item-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari barang di gudang ini…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">Tidak ada barang tersedia di gudang ini.</div>
            ) : (
              filtered.map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{it.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{it.sku}</span>
                      {it.brand_name && (
                        <span className="inline-flex items-center gap-1" style={{ color: it.brand_color }}>
                          <BrandDot color={it.brand_color} /> {it.brand_name}
                        </span>
                      )}
                      <span>· Tersedia {it.available_qty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      data-testid={`sj-minus-${it.id}`}
                      onClick={() => setItemQty(it.id, -1, it.available_qty)}
                      className="w-8 h-8 rounded-sm border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-40"
                      disabled={!qty[it.id]}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-mono font-semibold" data-testid={`sj-qty-${it.id}`}>{qty[it.id] || 0}</span>
                    <button
                      data-testid={`sj-plus-${it.id}`}
                      onClick={() => setItemQty(it.id, 1, it.available_qty)}
                      className="w-8 h-8 rounded-sm border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-40"
                      disabled={(qty[it.id] || 0) >= it.available_qty}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
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
