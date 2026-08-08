import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import ItemDetail from "@/pages/ItemDetail";
import SuratJalanList from "@/pages/SuratJalanList";
import SuratJalanCreate from "@/pages/SuratJalanCreate";
import SuratJalanDetail from "@/pages/SuratJalanDetail";
import PenerimaanList from "@/pages/PenerimaanList";
import PenerimaanCreate from "@/pages/PenerimaanCreate";
import PenerimaanDetail from "@/pages/PenerimaanDetail";
import Warehouses from "@/pages/master/Warehouses";
import Brands from "@/pages/master/Brands";
import Categories from "@/pages/master/Categories";
import UsersPage from "@/pages/master/Users";
import Profile from "@/pages/Profile";

const app = (el, admin) => (
  <ProtectedRoute adminOnly={admin}>
    <Layout>{el}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={app(<Dashboard />)} />
          <Route path="/inventori" element={app(<Inventory />)} />
          <Route path="/inventori/:id" element={app(<ItemDetail />)} />
          <Route path="/surat-jalan" element={app(<SuratJalanList />)} />
          <Route path="/surat-jalan/baru" element={app(<SuratJalanCreate />)} />
          <Route path="/surat-jalan/:id" element={app(<SuratJalanDetail />)} />
          <Route path="/penerimaan" element={app(<PenerimaanList />)} />
          <Route path="/penerimaan/baru" element={app(<PenerimaanCreate />)} />
          <Route path="/penerimaan/:id" element={app(<PenerimaanDetail />)} />
          <Route path="/master/warehouses" element={app(<Warehouses />, true)} />
          <Route path="/master/brands" element={app(<Brands />, true)} />
          <Route path="/master/categories" element={app(<Categories />, true)} />
          <Route path="/master/users" element={app(<UsersPage />, true)} />
          <Route path="/profil" element={app(<Profile />)} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
