import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  PackagePlus,
  Database,
  User,
  Warehouse,
  Tag,
  Layers,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/inventori", label: "Inventori", icon: Package },
  { to: "/surat-jalan", label: "Surat Jalan", icon: Truck },
  { to: "/penerimaan", label: "Penerimaan", icon: PackagePlus },
];

const MASTER = [
  { to: "/master/warehouses", label: "Gudang", icon: Warehouse },
  { to: "/master/brands", label: "Brand", icon: Tag },
  { to: "/master/categories", label: "Jenis", icon: Layers },
  { to: "/master/users", label: "Pengguna", icon: Users },
];

function NavItem({ item, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      data-testid={`sidebar-${item.label.toLowerCase().replace(/\s/g, "-")}-link`}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors",
          isActive
            ? "bg-brand text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          collapsed && "justify-center px-0"
        )
      }
    >
      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onNavClick, isAdmin }) {
  return (
    <div className="flex flex-col h-full">
      <div className={cn("h-16 flex items-center gap-2.5 border-b border-gray-200 px-4", collapsed && "justify-center px-0 gap-0")}>
        <img
          src={`${process.env.PUBLIC_URL}/company-logo.webp`}
          alt="Tim Kecil Inventory Control"
          className="w-9 h-9 object-contain shrink-0"
        />
        {!collapsed && (
          <span className="font-display font-bold text-[15px] leading-tight text-gray-900">
            Tim Kecil<br />Inventory Control
          </span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onClick={onNavClick} />
        ))}
        {isAdmin && (
          <div className="pt-4">
            {!collapsed && (
              <div className="overline text-gray-400 px-3 mb-2 flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Master Data
              </div>
            )}
            {MASTER.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} onClick={onNavClick} />
            ))}
          </div>
        )}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <NavItem item={{ to: "/profil", label: "Profil", icon: User }} collapsed={collapsed} onClick={onNavClick} />
      </div>
    </div>
  );
}

const TITLES = [
  [/^\/$/, "Dashboard"],
  [/^\/inventori/, "Inventori"],
  [/^\/surat-jalan/, "Surat Jalan"],
  [/^\/penerimaan/, "Penerimaan"],
  [/^\/master\/warehouses/, "Master · Gudang"],
  [/^\/master\/brands/, "Master · Brand"],
  [/^\/master\/categories/, "Master · Jenis"],
  [/^\/master\/users/, "Master · Pengguna"],
  [/^\/profil/, "Profil"],
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = TITLES.find(([re]) => re.test(location.pathname))?.[1] || "EventGudang";
  const initials = (user?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-[width] duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} isAdmin={isAdmin} />
      </aside>

      {/* mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent collapsed={false} isAdmin={isAdmin} onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* header */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6">
          <button
            data-testid="sidebar-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:inline-flex p-2 rounded-sm hover:bg-gray-100 text-gray-600"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            data-testid="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-sm hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-display font-bold text-lg text-gray-900 hidden sm:block">{title}</h2>

          <form
            className="ml-auto relative hidden md:block"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) navigate(`/inventori?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              data-testid="header-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari barang / SKU…"
              className="w-64 pl-9 pr-3 py-2 text-sm rounded-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="user-menu-btn" className="ml-auto md:ml-2 flex items-center gap-2 p-1 pr-2 rounded-sm hover:bg-gray-100">
                <span className="w-8 h-8 rounded-sm bg-brand text-white flex items-center justify-center text-xs font-bold font-mono">
                  {initials}
                </span>
                <span className="hidden sm:block text-sm font-medium text-gray-800 max-w-[140px] truncate">
                  {user?.full_name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-profile" onClick={() => navigate("/profil")}>
                <User className="w-4 h-4 mr-2" /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-logout" onClick={logout} className="text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">{children}</main>
      </div>
    </div>
  );
}
