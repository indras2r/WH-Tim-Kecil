import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle, Empty } from "@/components/common";

export default function PenerimaanList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/penerimaan").then((r) => setRows(r.data)).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageTitle title="Penerimaan Barang" subtitle="Barang masuk ke gudang">
        <button
          data-testid="create-penerimaan-btn"
          onClick={() => navigate("/penerimaan/baru")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-hover text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Terima Barang
        </button>
      </PageTitle>

      {loading ? (
        <div className="text-sm text-gray-400 p-6">Memuat…</div>
      ) : rows.length === 0 ? (
        <Empty title="Belum ada penerimaan" hint="Catat penerimaan barang pertama" />
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
              <tr>
                {["No. Penerimaan", "Supplier", "Gudang", "Tanggal", "Total Qty", "Barang Baru"].map((h) => (
                  <th key={h} className="px-4 py-3 overline font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((p) => {
                const totalQty = p.items.reduce((a, l) => a + l.qty, 0);
                const newCount = p.items.filter((l) => l.is_new).length;
                return (
                  <tr
                    key={p.id}
                    data-testid={`penerimaan-row-${p.id}`}
                    onClick={() => navigate(`/penerimaan/${p.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">{p.receipt_number}</td>
                    <td className="px-4 py-3 text-gray-800">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.warehouse_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.receipt_date || "—"}</td>
                    <td className="px-4 py-3 font-mono">{totalQty}</td>
                    <td className="px-4 py-3">
                      {newCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-brand/30 bg-brand/10 text-brand text-xs font-medium">
                          {newCount} BARU
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
