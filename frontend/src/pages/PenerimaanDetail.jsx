import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { PageTitle } from "@/components/common";

export default function PenerimaanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);

  useEffect(() => {
    api.get(`/penerimaan/${id}`).then((r) => setP(r.data)).catch((e) => toast.error(apiError(e)));
  }, [id]);

  if (!p) return <div className="text-sm text-gray-400">Memuat…</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>
      <PageTitle title={p.receipt_number} subtitle={`Supplier · ${p.supplier_name}`} />

      <div className="bg-white border border-gray-200 rounded-sm p-5 mb-6">
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <Info label="Gudang" value={p.warehouse_name} />
          <Info label="Supplier" value={p.supplier_name} />
          <Info label="Tanggal Terima" value={p.receipt_date || "—"} />
          <Info label="Dibuat oleh" value={p.created_by_name} />
          {p.notes && <div className="col-span-2"><Info label="Catatan" value={p.notes} /></div>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
            <tr>
              {["Barang", "SKU", "Qty", "Keterangan"].map((h) => (
                <th key={h} className="px-4 py-3 overline font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {p.items.map((l, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium text-gray-900">{l.item_name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{l.sku}</td>
                <td className="px-4 py-3 font-mono">{l.qty}</td>
                <td className="px-4 py-3">
                  {l.is_new ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-brand/30 bg-brand/10 text-brand text-xs font-medium">BARU</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Stok lama</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
