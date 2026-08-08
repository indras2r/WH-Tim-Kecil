import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ScanLine, Truck, Camera, X } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, StatusBadge, Empty } from "@/components/common";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SuratJalanList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("aktif");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/surat-jalan`);
      const rows = data.filter((sj) =>
        tab === "aktif" ? sj.status === "out" || sj.status === "partial" : sj.status === "returned"
      );
      setRows(rows);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [tab]);

  return (
    <div>
      <PageTitle title="Surat Jalan" subtitle="Barang keluar untuk event">
        <button
          data-testid="scan-qr-btn"
          onClick={() => setScanOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-gray-300 bg-white hover:border-gray-400 text-sm font-medium"
        >
          <ScanLine className="w-4 h-4" /> Scan QR
        </button>
        <button
          data-testid="create-sj-btn"
          onClick={() => navigate("/surat-jalan/baru")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Buat Surat Jalan
        </button>
      </PageTitle>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="aktif" data-testid="tab-aktif">Aktif</TabsTrigger>
          <TabsTrigger value="selesai" data-testid="tab-selesai">Selesai</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-sm text-gray-400 p-6">Memuat…</div>
      ) : rows.length === 0 ? (
        <Empty title="Belum ada surat jalan" hint={tab === "aktif" ? "Buat surat jalan baru" : "Belum ada yang selesai"} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
              <tr>
                {["No. SJ", "Event", "Penerima", "Gudang", "Tanggal", "Qty", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 overline font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((sj) => {
                const qty = sj.items.reduce((a, l) => a + l.qty, 0);
                return (
                  <tr
                    key={sj.id}
                    data-testid={`sj-row-${sj.id}`}
                    onClick={() => navigate(`/surat-jalan/${sj.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">{sj.sj_number}</td>
                    <td className="px-4 py-3 text-gray-800">{sj.event_name}</td>
                    <td className="px-4 py-3 text-gray-600">{sj.recipient_name}</td>
                    <td className="px-4 py-3 text-gray-600">{sj.warehouse_name}</td>
                    <td className="px-4 py-3 text-gray-600">{sj.event_date || "—"}</td>
                    <td className="px-4 py-3 font-mono">{qty}</td>
                    <td className="px-4 py-3"><StatusBadge status={sj.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}

function ScanDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [manual, setManual] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!open) return;
    let stream, raf, detector, video;
    const start = async () => {
      if (!("BarcodeDetector" in window)) { setSupported(false); return; }
      try {
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video = document.getElementById("scan-video");
        video.srcObject = stream;
        await video.play();
        const scan = async () => {
          try {
            const codes = await detector.detect(video);
            if (codes.length) { handleToken(codes[0].rawValue); return; }
          } catch (_) {}
          raf = requestAnimationFrame(scan);
        };
        raf = requestAnimationFrame(scan);
      } catch (_) {
        setSupported(false);
      }
    };
    start();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  const handleToken = async (token) => {
    try {
      const { data } = await api.get(`/surat-jalan/by-token/${token.trim()}`);
      onOpenChange(false);
      navigate(`/surat-jalan/${data.id}`);
    } catch (e) {
      toast.error("QR tidak cocok dengan surat jalan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2"><Camera className="w-5 h-5" /> Scan QR Surat Jalan</DialogTitle>
        </DialogHeader>
        {supported ? (
          <div className="rounded-sm overflow-hidden border border-gray-200 bg-black aspect-video relative">
            <video id="scan-video" className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-8 border-2 border-white/70 rounded-sm pointer-events-none" />
          </div>
        ) : (
          <p className="text-sm text-amber-600">Kamera / QR scanner tidak tersedia di perangkat ini. Masukkan token manual di bawah.</p>
        )}
        <div className="flex gap-2 mt-2">
          <input
            data-testid="scan-token-input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Tempel token QR…"
            className="flex-1 px-3 py-2 text-sm rounded-sm border border-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            data-testid="scan-token-go"
            onClick={() => manual.trim() && handleToken(manual)}
            className="px-4 py-2 text-sm rounded-sm bg-brand hover:bg-brand-hover text-white font-medium"
          >
            Buka
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
