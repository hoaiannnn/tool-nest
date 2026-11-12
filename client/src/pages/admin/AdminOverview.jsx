import { useEffect, useState } from "react";
import { CATEGORY_MAP } from "../../data/servicesData";
import { fetchApi } from "../../lib/api";
import { formatDateTime, formatVnd } from "../../lib/format";

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchApi("/admin/overview")
            .then((res) => setData(res.data))
            .catch((err) => setError(err.message));
    }, []);

    if (error) return <p className="form-error">{error}</p>;
    if (!data) return <div className="empty-box">Đang tải thống kê...</div>;

    const { stats, topServices, recentLogs } = data;

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1 className="admin-header__title">Tổng quan hệ thống</h1>
                    <p className="admin-header__sub">Số liệu tổng hợp từ cơ sở dữ liệu ToolNest.</p>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="panel kpi-card">
                    <span className="kpi-card__label">Người dùng</span>
                    <b className="kpi-card__value">{stats.totalUsers.toLocaleString("vi-VN")}</b>
                    <span className="kpi-card__hint">{stats.paidUsers} đã nâng cấp gói</span>
                </div>
                <div className="panel kpi-card">
                    <span className="kpi-card__label">Lượt sử dụng công cụ</span>
                    <b className="kpi-card__value">{stats.totalUses.toLocaleString("vi-VN")}</b>
                    <span className="kpi-card__hint">Cộng dồn mọi dịch vụ</span>
                </div>
                <div className="panel kpi-card">
                    <span className="kpi-card__label">Doanh thu</span>
                    <b className="kpi-card__value">{formatVnd(stats.totalRevenue)}</b>
                    <span className="kpi-card__hint">Từ các giao dịch đã thanh toán</span>
                </div>
                <div className="panel kpi-card">
                    <span className="kpi-card__label">Dịch vụ</span>
                    <b className="kpi-card__value">{stats.totalServices}</b>
                    <span className="kpi-card__hint">{stats.totalAdmins} quản trị viên</span>
                </div>
            </div>

            <div className="admin-overview-grid">
                <div className="panel table-panel">
                    <div className="admin-panel-head">
                        <h2 className="admin-panel-title">Dịch vụ dùng nhiều nhất</h2>
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Dịch vụ</th>
                                    <th>Danh mục</th>
                                    <th>Lượt dùng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topServices.map((s) => (
                                    <tr key={s.id}>
                                        <td><b className="data-table__strong">{s.name}</b></td>
                                        <td>
                                            <span className="status-tag neutral">
                                                {(CATEGORY_MAP[s.category] || CATEGORY_MAP.pdf).short}
                                            </span>
                                        </td>
                                        <td>{s.uses.toLocaleString("vi-VN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="panel table-panel">
                    <div className="admin-panel-head">
                        <h2 className="admin-panel-title">Hoạt động gần đây</h2>
                    </div>
                    {recentLogs.length === 0 ? (
                        <div className="empty-box">Chưa có hoạt động nào.</div>
                    ) : (
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Thời gian</th>
                                        <th>Người dùng</th>
                                        <th>Dịch vụ</th>
                                        <th>Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLogs.map((l) => (
                                        <tr key={l.id}>
                                            <td className="data-table__muted">{formatDateTime(l.createdAt)}</td>
                                            <td>{l.userName || l.userEmail || "Khách"}</td>
                                            <td>{l.serviceName}</td>
                                            <td>
                                                <span className={`status-tag ${l.status === "success" ? "success" : "coming-soon"}`}>
                                                    {l.status === "success" ? "Thành công" : "Thất bại"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}