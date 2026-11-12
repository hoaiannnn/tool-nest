import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Tool from "./pages/Tool";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminServices from "./pages/admin/AdminServices";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminAdmins from "./pages/admin/AdminAdmins";
import ProtectedRoute from "./components/ProtectedRoute";
import { fetchApi } from "./lib/api";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetchApi("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  return (
    <Routes>
      <Route element={<MainLayout user={user} setUser={setUser} />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/tool/:id" element={<Tool user={user} />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user} loading={authLoading}>
              <Profile user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />
        <Route path="/plans" element={<Plans user={user} />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute user={user} loading={authLoading}>
              <Checkout user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
      </Route>

      <Route
        path="/admin"
        element={<AdminLayout user={user} setUser={setUser} loading={authLoading} />}
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="admins" element={<AdminAdmins />} />
      </Route>
    </Routes>
  );
}

export default App;