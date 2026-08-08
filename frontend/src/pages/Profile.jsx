import { Link } from "react-router-dom";
import { Shield, User as UserIcon, LogOut, Warehouse, Tag, Layers, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageTitle } from "@/components/common";

const ADMIN_LINKS = [
  { to: "/master/users", label: "Pengguna", icon: Users },
  { to: "/master/warehouses", label: "Gudang", icon: Warehouse },
  { to: "/master/brands", label: "Brand", icon: Tag },
  { to: "/master/categories", label: "Jenis", icon: Layers },
];

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="max-w-2xl">
      <PageTitle title="Profil" subtitle="Informasi akun Anda" />

      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-sm bg-brand text-white flex items-center justify-center text-xl font-bold font-mono">
            {(user?.full_name || user?.email || "?").slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-xs font-medium ${isAdmin ? "bg-brand/10 text-brand border-brand/30" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {isAdmin ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />} {user?.role}
            </span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-6">
          <p className="overline text-gray-400 mb-3">Manajemen Master Data</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} data-testid={`profile-link-${label.toLowerCase()}`} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-sm hover:border-brand hover:bg-brand/5 transition-colors group">
                <span className="w-9 h-9 rounded-sm bg-gray-100 group-hover:bg-brand group-hover:text-white flex items-center justify-center text-gray-600 transition-colors">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="font-medium text-gray-900 flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        data-testid="profile-logout-btn"
        onClick={logout}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
      >
        <LogOut className="w-4 h-4" /> Keluar dari Akun
      </button>
    </div>
  );
}
