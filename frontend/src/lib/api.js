import axios from "axios";

// Backend base URL.
// - Default: the per-environment backend provided by the platform (always up
//   in both preview and production).
// - Override: set REACT_APP_API_URL in frontend/.env to point at an external /
//   shared backend (e.g. the mobile app's backend) once it has a STABLE URL.
const BACKEND_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("eg_token");
      localStorage.removeItem("eg_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export function apiError(e) {
  const d = e?.response?.data?.detail;
  if (d == null) return e?.message || "Terjadi kesalahan";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  if (d?.msg) return d.msg;
  return String(d);
}
