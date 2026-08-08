import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import QRCode from "qrcode";
import { ArrowLeft, Printer, RotateCcw, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, StatusBadge } from "@/components/common";
import { printSuratJalan } from "@/lib/pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SuratJalanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sj, setSj] = useState(null);
  const [qrSvg, setQrSvg] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/surat-jalan/${id}`);
      setSj(data);
      const svg = await QRCode.toString(data.qr_token, { type: "svg", margin: 1, width: 180 });
      setQrSvg(svg);
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  useEffect(() => { load(); }, [id]);

  if (!sj) return <div className="text-sm text-gray-400">Memuat…</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>
      <PageTitle title={sj.sj_number} subtitle={sj.event_name}>
        <StatusBadge status={sj.status} testid="sj-detail-status" />
        <button
          data-testid="print-pdf-btn"
          onClick={() => printSuratJalan(sj)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-gray-300 bg-white hover:border-gray-400 text-sm font-medium"
        >
          <Printer className="w-4 h-4" /> Print PDF
        </button>
        {sj.status !== "returned" && (
          <button
            data-testid="return-open-btn"
            onClick={() => setReturnOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" /> Terima Kembali
          </button>
        )}
      </PageTitle>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-sm p-5 flex flex-col items-center">
          <p className="overline text-gray-400 self-start mb-3">QR Code</p>
          <div className="w-44 h-44 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="font-mono text-[10px] text-gray-400 mt-3 break-all text-center">{sj.qr_token}</p>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm p-5">
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <Info label="Gudang Sumber" value={sj.warehouse_name} />
            <Info label="Penerima" value={sj.recipient_name} />
            <Info label="Event" value={sj.event_name} />
            <Info label="Tanggal Event" value={sj.event_date || "—"} />
            <Info label="Dibuat oleh" value={sj.created_by_name} />
            <Info label="Dibuat" value={new Date(sj.created_at).toLocaleString("id-ID")} />
            {sj.notes && <div className="col-span-2"><Info label="Catatan" value={sj.notes} /></div>}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
            <tr>
              {["Barang", "SKU", "Qty", "Kembali", "Rusak", "Hilang", "Terpakai", "Sisa"].map((h) => (
                <th key={h} className="px-4 py-3 overline font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sj.items.map((l) => {
              const sisa = l.qty - (l.returned_qty + l.damaged_qty + l.lost_qty + l.used_qty);
              return (
                <tr key={l.item_id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{l.item_name}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{l.sku}</td>
                  <td className="px-4 py-3 font-mono">{l.qty}</td>
                  <td className="px-4 py-3 font-mono text-emerald-600">{l.returned_qty}</td>
                  <td className="px-4 py-3 font-mono text-orange-600">{l.damaged_qty}</td>
                  <td className="px-4 py-3 font-mono text-red-600">{l.lost_qty}</td>
                  <td className="px-4 py-3 font-mono text-violet-600">{l.used_qty}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{sisa}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ReturnDialog open={returnOpen} onOpenChange={setReturnOpen} sj={sj} onDone={() => { setReturnOpen(false); load(); }} />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="overline text-gray-400">{label}</div>
      <div className="text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

function ReturnDialog({ open, onOpenChange, sj, onDone }) {
  const [state, setState] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const init = {};
      sj.items.forEach((l) => { init[l.item_id] = { returned_qty: 0, damaged_qty: 0, lost_qty: 0, used_qty: 0 }; });
      setState(init);
    }
  }, [open]); // eslint-disable-line

  const setVal = (id, field, v, max) => {
    setState((s) => {
      const cur = { ...s[id], [field]: Math.max(0, Number(v) || 0) };
      const others = ["returned_qty", "damaged_qty", "lost_qty", "used_qty"].reduce(
        (a, k) => (k === field ? a : a + cur[k]), 0);
      if (cur[field] + others > max) cur[field] = Math.max(0, max - others);
      return { ...s, [id]: cur };
    });
  };

  const submit = async () => {
    const lines = Object.entries(state)
      .map(([item_id, v]) => ({ item_id, ...v }))
      .filter((l) => l.returned_qty + l.damaged_qty + l.lost_qty + l.used_qty > 0);
    if (!lines.length) return toast.error("Isi minimal satu jumlah pengembalian");
    setSaving(true);
    try {
      await api.post(`/surat-jalan/${sj.id}/return`, { lines });
      toast.success("Pengembalian dicatat");
      onDone();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  const FIELDS = [
    { k: "returned_qty", label: "Baik", cls: "focus:ring-emerald-400" },
    { k: "damaged_qty", label: "Rusak", cls: "focus:ring-orange-400" },
    { k: "lost_qty", label: "Hilang", cls: "focus:ring-red-400" },
    { k: "used_qty", label: "Terpakai", cls: "focus:ring-violet-400" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Terima Kembali</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {sj.items.map((l) => {
            const done = l.returned_qty + l.damaged_qty + l.lost_qty + l.used_qty;
            const sisa = l.qty - done;
            return (
              <div key={l.item_id} className="border border-gray-200 rounded-sm p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{l.item_name}</div>
                    <div className="text-xs text-gray-500 font-mono">{l.sku} · sisa {sisa} dari {l.qty}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {FIELDS.map((f) => (
                    <div key={f.k}>
                      <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                      <input
                        data-testid={`return-${f.k}-${l.item_id}`}
                        type="number"
                        min="0"
                        disabled={sisa <= 0}
                        value={state[l.item_id]?.[f.k] ?? 0}
                        onChange={(e) => setVal(l.item_id, f.k, e.target.value, sisa)}
                        className={`w-full px-2 py-1.5 rounded-sm border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 ${f.cls} disabled:bg-gray-100`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-sm p-3 space-y-1">
            <p><b className="text-emerald-600">Baik</b> — kembali ke stok tersedia.</p>
            <p><b className="text-orange-600">Rusak</b> — masuk hitungan rusak, tidak kembali ke stok.</p>
            <p><b className="text-red-600">Hilang</b> — dikurangi dari total stok.</p>
            <p><b className="text-violet-600">Terpakai</b> — habis terpakai (mis. merchandise), dikurangi dari total.</p>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm rounded-sm border border-gray-300 hover:border-gray-400">Batal</button>
          <button
            data-testid="return-submit-btn"
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-sm bg-brand hover:bg-brand-hover text-white font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Pengembalian
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
