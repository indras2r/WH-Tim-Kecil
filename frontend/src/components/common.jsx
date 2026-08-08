import { cn } from "@/lib/utils";

export function BrandDot({ color, className }) {
  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full shrink-0", className)}
      style={{ backgroundColor: color || "#9CA3AF" }}
    />
  );
}

const SJ_STATUS = {
  out: { label: "Keluar", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  partial: { label: "Sebagian", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  returned: { label: "Selesai", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export function StatusBadge({ status, testid }) {
  const s = SJ_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span
      data-testid={testid}
      className={cn("inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium", s.cls)}
    >
      {s.label}
    </span>
  );
}

export function StockBadge({ available, total }) {
  let cls = "bg-emerald-100 text-emerald-800 border-emerald-200";
  let label = "Tersedia";
  if (available <= 0) {
    cls = "bg-red-100 text-red-800 border-red-200";
    label = "Habis";
  } else if (available < total * 0.25) {
    cls = "bg-amber-100 text-amber-800 border-amber-200";
    label = "Menipis";
  }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium", cls)}>
      {label}
    </span>
  );
}

export function PageTitle({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Chip({ active, color, onClick, children, testid }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors",
        active
          ? "bg-brand text-white border-brand"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-gray-900"
      )}
    >
      {color && <BrandDot color={active ? "#ffffff" : color} />}
      {children}
    </button>
  );
}

export function Empty({ title, hint }) {
  return (
    <div className="text-center py-16 border border-dashed border-gray-300 rounded-sm bg-white">
      <p className="font-display text-lg font-medium text-gray-700">{title}</p>
      {hint && <p className="text-sm text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
