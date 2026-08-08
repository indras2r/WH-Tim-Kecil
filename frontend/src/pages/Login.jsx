import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Package, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Berhasil masuk");
      navigate("/");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative">
        <img
          src="https://images.unsplash.com/photo-1644079446600-219068676743?auto=format&fit=crop&w=1400&q=80"
          alt="Gudang"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand/70 mix-blend-multiply" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div className="font-display font-black text-2xl">
            Event<span className="opacity-80">Gudang</span>
          </div>
          <div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
              Kelola aset event Anda dengan presisi.
            </h1>
            <p className="mt-4 text-white/80 max-w-md">
              Sound, lighting, rigging & merchandise — semua dalam satu sistem inventori terpadu.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <span className="w-10 h-10 rounded-sm bg-brand text-white flex items-center justify-center">
              <Package className="w-5 h-5" />
            </span>
            <span className="font-display font-black text-xl">
              Event<span className="text-brand">Gudang</span>
            </span>
          </div>
          <p className="overline text-gray-400">Selamat datang kembali</p>
          <h2 className="font-display text-3xl font-bold text-gray-900 mt-1 mb-8">Masuk ke akun</h2>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                data-testid="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="mt-1.5 w-full px-3 py-2.5 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
              <div className="relative mt-1.5">
                <input
                  data-testid="login-password-input"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-sm bg-brand hover:bg-brand-hover text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
