import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("eg_user");
    if (u) return JSON.parse(u);
    return localStorage.getItem("eg_token") ? null : false;
  });

  useEffect(() => {
    if (localStorage.getItem("eg_token")) {
      api
        .get("/auth/me")
        .then((r) => {
          setUser(r.data);
          localStorage.setItem("eg_user", JSON.stringify(r.data));
        })
        .catch(() => setUser(false));
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("eg_token", data.access_token);
    localStorage.setItem("eg_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("eg_token");
    localStorage.removeItem("eg_user");
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthCtx.Provider>
  );
}
