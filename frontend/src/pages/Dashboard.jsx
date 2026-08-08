import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Truck,
  Boxes,
  Warehouse,
  AlertTriangle,
  Ban,
  Recycle,
  FileText,
  Plus,
  PackagePlus,
  ArrowRight,
} from "lucide-react";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { PageTitle, StatusBadge, Empty } from "@/components/common";

const KPIS = [
  { key: "total_items", label: "Jenis Barang", icon: Package, tone: "text-brand" },
  { key: "units_available", label: "Tersedia", icon: CheckCircle2, tone: "text-emerald-600" },
  { key: "units_out", label: "Keluar", icon: Truck, tone: "text-amber-600" },
  { key: "total_units", label: "Total Unit", icon: Boxes, tone: "text-gray-700" },
  { key: "warehouses", label: "Gudang", icon: Warehouse, tone: "text-brand" },
  { key: "units_damaged", label: "Rusak", icon: AlertTriangle, tone: "text-orange-600" },
  { key: "units_lost", label: "Hilang", icon: Ban, tone: "text-red-600" },
  { key: "units_used", label: "Terpakai", icon: Recycle, tone: "text-violet-600" },
  { key: "sj_active", label: "SJ Aktif", icon: FileText, tone: "text-blue-600" },
  { key: "sj_returned", label: "SJ Selesai", icon: CheckCircle2, tone: "text-emerald-600" },
];

export default function Dashboard() {
  const [d, setD] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard").then((r) => setD(r.data)).catch((e) => toast.error(apiError(e)));
  }, []);

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="Ringkasan inventori & aktivitas gudang">
        <button
          data-testid="quick-buat-sj"
          onClick={() => navigate("/surat-jalan/baru")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Buat Surat Jalan
        </button>
        <button
          data-testid="quick-terima-barang"
          onClick={() => navigate("/penerimaan/baru")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-gray-300 bg-white hover:border-gray-400 text-sm font-medium transition-colors"
        >
          <PackagePlus className="w-4 h-4" /> Terima Barang
        </button>
      </PageTitle>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPIS.map(({ key, label, icon: Icon, tone }) => (
          <div
            key={key}
            data-testid={`kpi-${key}`}
            className="bg-white border border-gray-200 rounded-sm p-4 hover:-translate-y-1 hover:shadow-sm transition-transform"
          >
            <div className="flex items-center justify-between">
              <span className="overline text-gray-400">{label}</span>
              <Icon className={`w-4 h-4 ${tone}`} strokeWidth={1.75} />
            </div>
            <div className="font-display text-3xl font-bold text-gray-900 mt-3 font-mono">
              {d ? d[key] ?? 0 : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="font-display font-bold text-gray-900">Surat Jalan Terbaru</h3>
            <Link to="/surat-jalan" className="text-sm text-brand hover:text-brand-hover font-medium inline-flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {!d ? (
              <div className="p-6 text-sm text-gray-400">Memuat…</div>
            ) : d.recent_sj.length === 0 ? (
              <div className="p-6">
                <Empty title="Belum ada surat jalan" hint="Buat surat jalan pertama Anda" />
              </div>
            ) : (
              d.recent_sj.map((sj) => (
                <Link
                  key={sj.id}
                  to={`/surat-jalan/${sj.id}`}
                  data-testid={`recent-sj-${sj.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-gray-900">{sj.sj_number}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {sj.event_name} · {sj.recipient_name}
                    </div>
                  </div>
                  <StatusBadge status={sj.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h3 className="font-display font-bold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="space-y-2">
            <QuickLink to="/surat-jalan/baru" icon={Truck} label="Buat Surat Jalan" desc="Kirim barang ke event" />
            <QuickLink to="/penerimaan/baru" icon={PackagePlus} label="Terima Barang" desc="Catat barang masuk" />
            <QuickLink to="/penerimaan" icon={FileText} label="Riwayat Penerimaan" desc="Lihat semua penerimaan" />
            <QuickLink to="/inventori" icon={Package} label="Kelola Inventori" desc="Daftar & stok barang" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-sm border border-gray-200 hover:border-brand hover:bg-brand/5 transition-colors group"
    >
      <span className="w-9 h-9 rounded-sm bg-gray-100 group-hover:bg-brand group-hover:text-white flex items-center justify-center text-gray-600 transition-colors">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </Link>
  );
}
