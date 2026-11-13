import { Link, NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { fetchApi } from "../lib/api";

const NAV_ITEMS = [
    { to: "/admin", label: "Tổng quan hệ thống", end: true },
    { to: "/admin/users", label: "Quản lý người dùng" },
    { to: "/admin/services", label: "Quản lý dịch vụ" },
    { to: "/admin/activity", label: "Nhật ký hoạt động" },
    { to: "/admin/admins", label: "Quản trị viên" },
];

export default function AdminLayout({ user, setUser, loading }) {
    const navigate = useNavigate();

    if (loading) {
        return <div className="admin-loading">Đang tải...</div>;
    }
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "admin") return <Navigate to="/" replace />;

    async function handleLogout() {
        try {
            await fetchApi("/auth/logout", { method: "POST" });
        } catch (err) {
            console.error("Lỗi đăng xuất:", err);
        }
        setUser(null);
        navigate("/login");
    }

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-sidebar__brand">
                    <Link to="/" className="admin-sidebar__logo">
                        ToolNest <span className="status-tag neutral">Admin</span>
                    </Link>
                </div>

                <nav className="admin-nav" aria-label="Menu quản trị">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `admin-nav__link ${isActive ? "is-active" : ""}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar__foot">
                    <div className="admin-sidebar__user">
                        <b>{user.full_name}</b>
                        <small>{user.email}</small>
                    </div>
                    <Link to="/" className="btn ghost admin-sidebar__btn">
                        &larr; Về trang người dùng
                    </Link>
                    <button type="button" className="btn ghost admin-sidebar__btn" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <div className="admin-container">
                   <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
}