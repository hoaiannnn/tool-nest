import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { fetchApi } from "./lib/api";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Tool from "./pages/Tool";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

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
    <>
      <Routes>
        <Route element={<MainLayout user={user} setUser={setUser} />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/tool/:id" element={<Tool  user={user}/>} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute user={user} loading={authLoading}>
                  <Profile user={user} setUser={setUser} />
                </ProtectedRoute>
              }
            />
        </Route>

        <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;