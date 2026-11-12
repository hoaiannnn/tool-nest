import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import { formatDateTime, normalize } from "../../lib/format";
import { usePagination } from "../../lib/usePagination";
import Pager from "../../components/Pager";

const PAGE_SIZE = 10;
const PLAN_LABEL = { free: "Free", pro: "Pro", team: "Team" };

export default function AdminUsers() {
    const [users, setUsers] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState(null);

    const [query, setQuery] = useState("");
    const [plan, setPlan] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchApi("/admin/users")
            .then((res) => setUsers(res.data))
            .catch((err) => setError(err.message));
    }, []);

    const filtered = (users || []).filter((u) => {
        if (plan && u.planType !== plan) return false;
        if (status && u.status !== status) return false;
        if (query) {
            const q = normalize(query);
            if (!normalize(u.fullName).includes(q) && !normalize(u.email).includes(q)) return false;
        }
        return true;
    });

    const { items, page, setPage, total } = usePagination(filtered, PAGE_SIZE, `${query}|${plan}|${status}`);

    async function handleToggle(user) {
        const locking = user.status !== "locked";
        const ok = window.confirm(
            locking ? `Khoá tài khoản ${user.email}?` : `Mở khoá tài khoản ${user.email}?`
        );
        if (!ok) return;

        setError("");
        setNotice("");
        setBusyId(user.id);
        try {
            const res = await fetchApi(`/admin/users/${user.id}/toggle-status`, { method: "PATCH" });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: res.data.status } : u)));
            setNotice(res.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1 className="admin-header__title">Quản lý người dùng</h1>
                    <p className="admin-header__sub">Xem tài khoản, gói dịch vụ và khoá hoặc mở khoá người dùng.</p>
                </div>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    className="toolbar__search"
                    placeholder="Tìm theo họ tên hoặc email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <select className="toolbar__select" value={plan} onChange={(e) => setPlan(e.target.value)}>
                    <option value="">Gói: tất cả</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="team">Team</option>
                </select>
                <select className="toolbar__select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Trạng thái: tất cả</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Đã khoá</option>
                </select>
            </div>

            {error && <p className="form-error">{error}</p>}
            {notice && <p className="form-success admin-section">{notice}</p>}

            {users === null && !error ? (
                <div className="empty-box">Đang tải...</div>
            ) : total === 0 ? (
                <div className="empty-box">Không có người dùng nào khớp bộ lọc.</div>
            ) : (
                <>
                    <div className="panel table-panel">
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Điện thoại</th>
                                        <th>Gói</th>
                                        <th>Credits</th>
                                        <th>Ngày tạo</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <b className="data-table__strong">{u.fullName}</b>
                                                <div className="data-table__muted">{u.email}</div>
                                            </td>
                                            <td className="data-table__muted">{u.phone || "-"}</td>
                                            <td>
                                                <span className={`status-tag ${u.planType === "free" ? "neutral" : "success"}`}>
                                                    {PLAN_LABEL[u.planType] || u.planType}
                                                </span>
                                            </td>
                                            <td>{u.credits.toLocaleString("vi-VN")}</td>
                                            <td className="data-table__muted">{formatDateTime(u.createdAt)}</td>
                                            <td>
                                                <span className={`status-tag ${u.status === "locked" ? "coming-soon" : "success"}`}>
                                                    {u.status === "locked" ? "Đã khoá" : "Hoạt động"}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`btn ghost btn--sm ${u.status === "locked" ? "" : "btn--danger"}`}
                                                    disabled={busyId === u.id}
                                                    onClick={() => handleToggle(u)}
                                                >
                                                    {u.status === "locked" ? "Mở khoá" : "Khoá"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pager page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
                </>
            )}
        </>
    );
}