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

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchApi("/auth/me")
    .then((res) => setUser(res.data))
    .catch(() => setUser(null));
  }, []);

  return (
    <>
      <Routes>
        <Route element={<MainLayout user={user} setUser={setUser} />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/tool/:id" element={<Tool  user={user}/>} />
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