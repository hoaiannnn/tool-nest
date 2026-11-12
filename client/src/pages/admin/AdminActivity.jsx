import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import { formatDateTime, normalize } from "../../lib/format";
import { usePagination } from "../../lib/usePagination";
import Pager from "../../components/Pager";

const PAGE_SIZE = 15;

export default function AdminActivity() {
    const [logs, setLogs] = useState(null);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchApi("/admin/activity")
            .then((res) => setLogs(res.data))
            .catch((err) => setError(err.message));
    }, []);

    const filtered = (logs || []).filter((l) => {
        if (status && l.status !== status) return false;
        if (query) {
            const q = normalize(query);
            const haystack = normalize(`${l.userName} ${l.userEmail} ${l.serviceName} ${l.inputSummary}`);
            if (!haystack.includes(q)) return false;
        }
        return true;
    });

    const { items, page, setPage, total } = usePagination(filtered, PAGE_SIZE, `${query}|${status}`);

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1 className="admin-header__title">Nhật ký hoạt động</h1>
                    <p className="admin-header__sub">500 lượt sử dụng công cụ gần nhất của toàn hệ thống.</p>
                </div>
            </div>

            <div className="toolbar">
                <input
                    type="search"
                    className="toolbar__search"
                    placeholder="Tìm theo người dùng, dịch vụ hoặc dữ liệu đầu vào..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <select className="toolbar__select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Trạng thái: tất cả</option>
                    <option value="success">Thành công</option>
                    <option value="failed">Thất bại</option>
                </select>
            </div>

            {error && <p className="form-error">{error}</p>}

            {logs === null && !error ? (
                <div className="empty-box">Đang tải...</div>
            ) : total === 0 ? (
                <div className="empty-box">Không có hoạt động nào khớp bộ lọc.</div>
            ) : (
                <>
                    <div className="panel table-panel">
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Thời gian</th>
                                        <th>Người dùng</th>
                                        <th>Dịch vụ</th>
                                        <th>Dữ liệu đầu vào</th>
                                        <th>Thời lượng</th>
                                        <th>Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((l) => (
                                        <tr key={l.id}>
                                            <td className="data-table__muted">{formatDateTime(l.createdAt)}</td>
                                            <td>
                                                <b className="data-table__strong">{l.userName || "Khách"}</b>
                                                <div className="data-table__muted">{l.userEmail || ""}</div>
                                            </td>
                                            <td>{l.serviceName}</td>
                                            <td className="data-table__file" title={l.inputSummary}>{l.inputSummary}</td>
                                            <td className="data-table__muted">{(l.durationMs / 1000).toFixed(1)}s</td>
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
                    </div>
                    <Pager page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
                </>
            )}
        </>
    );
}