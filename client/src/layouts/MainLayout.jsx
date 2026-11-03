import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout({ user, setUser }) {
  return (
    <>
      <Header user={user} setUser={setUser}/>
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}