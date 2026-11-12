import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_MAP } from "../../data/servicesData";
import { fetchApi } from "../../lib/api";
import { normalize } from "../../lib/format";
import { usePagination } from "../../lib/usePagination";
import Pager from "../../components/Pager";

const PAGE_SIZE = 10;
const EMPTY_FORM = { name: "", category: "pdf", desc: "", status: "ready", creditCost: 0, visible: true };

export default function AdminServices() {
    const [services, setServices] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [query, setQuery] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(() => {
        return fetchApi("/admin/services")
            .then((res) => setServices(res.data))
            .catch((err) => setError(err.message));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = (services || []).filter((s) => !query || normalize(s.name).includes(normalize(query)));
    const { items, page, setPage, total } = usePagination(filtered, PAGE_SIZE, query);

    function handleFormChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function openCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setError("");
        setNotice("");
        setShowForm(true);
    }

    function openEdit(s) {
        setEditingId(s.id);
        setForm({
            name: s.name,
            category: s.category,
            desc: s.desc,
            status: s.status,
            creditCost: s.creditCost,
            visible: s.visible,
        });
        setError("");
        setNotice("");
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (!form.name.trim()) return setError("Tên dịch vụ không được để trống.");
        const cost = Number(form.creditCost);
        if (!Number.isInteger(cost) || cost < 0) return setError("Chi phí Credits phải là số nguyên không âm.");

        setSaving(true);
        try {
            const body = JSON.stringify({ ...form, creditCost: cost });
            const res = editingId
                ? await fetchApi(`/admin/services/${editingId}`, { method: "PUT", body })
                : await fetchApi("/admin/services", { method: "POST", body });
            setNotice(res.message);
            closeForm();
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleVisible(s) {
        setError("");
        setNotice("");
        setBusyId(s.id);
        try {
            const res = await fetchApi(`/admin/services/${s.id}`, {
                method: "PUT",
                body: JSON.stringify({ visible: !s.visible }),
            });
            setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, visible: !s.visible } : x)));
            setNotice(res.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    async function handleDelete(s) {
        if (!window.confirm(`Xoá dịch vụ "${s.name}"? Thao tác này không hoàn tác được.`)) return;

        setError("");
        setNotice("");
        setBusyId(s.id);
        try {
            const res = await fetchApi(`/admin/services/${s.id}`, { method: "DELETE" });
            setServices((prev) => prev.filter((x) => x.id !== s.id));
            setNotice(res.message);
        } catch (err) {
            setError(err.message); // ví dụ: dịch vụ đã có lịch sử, chỉ được ẩn
        } finally {
            setBusyId(null);
        }
    }

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1 className="admin-header__title">Quản lý dịch vụ</h1>
                    <p className="admin-header__sub">Thêm, sửa, ẩn hoặc xoá các công cụ hiển thị trên website.</p>
                </div>
                <button type="button" className="btn" onClick={openCreate}>
                    + Thêm dịch vụ
                </button>
            </div>

            {error && <p className="form-error">{error}</p>}
            {notice && <p className="form-success admin-section">{notice}</p>}

            {showForm && (
                <div className="panel admin-section">
                    <div className="admin-panel-head">
                        <h2 className="admin-panel-title">{editingId ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}</h2>
                    </div>

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="profile-form__row">
                            <div className="tool-field">
                                <label className="tool-field__label" htmlFor="sv-name">Tên dịch vụ</label>
                                <input id="sv-name" name="name" type="text" className="tool-field__control"
                                    value={form.name} onChange={handleFormChange} />
                            </div>
                            <div className="tool-field">
                                <label className="tool-field__label" htmlFor="sv-category">Danh mục</label>
                                <select id="sv-category" name="category" className="tool-field__control"
                                    value={form.category} onChange={handleFormChange}>
                                    {CATEGORIES.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="tool-field">
                            <label className="tool-field__label" htmlFor="sv-desc">Mô tả ngắn</label>
                            <input id="sv-desc" name="desc" type="text" className="tool-field__control"
                                value={form.desc} onChange={handleFormChange} />
                        </div>

                        <div className="profile-form__row">
                            <div className="tool-field">
                                <label className="tool-field__label" htmlFor="sv-status">Trạng thái</label>
                                <select id="sv-status" name="status" className="tool-field__control"
                                    value={form.status} onChange={handleFormChange}>
                                    <option value="ready">Sẵn sàng</option>
                                    <option value="soon">Sắp ra mắt</option>
                                </select>
                            </div>
                            <div className="tool-field">
                                <label className="tool-field__label" htmlFor="sv-cost">Chi phí (Credits)</label>
                                <input id="sv-cost" name="creditCost" type="number" min="0" className="tool-field__control"
                                    value={form.creditCost} onChange={handleFormChange} />
                            </div>
                        </div>

                        <label className="checkbox-field">
                            <input type="checkbox" name="visible" checked={form.visible} onChange={handleFormChange} />
                            Hiển thị trên website
                        </label>

                        <div className="profile-form__actions">
                            <button type="button" className="btn ghost" onClick={closeForm}>Huỷ</button>
                            <button type="submit" className="btn" disabled={saving}>
                                {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm dịch vụ"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="toolbar">
                <input
                    type="search"
                    className="toolbar__search"
                    placeholder="Tìm theo tên dịch vụ..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {services === null && !error ? (
                <div className="empty-box">Đang tải...</div>
            ) : total === 0 ? (
                <div className="empty-box">Không có dịch vụ nào.</div>
            ) : (
                <>
                    <div className="panel table-panel">
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Dịch vụ</th>
                                        <th>Danh mục</th>
                                        <th>Trạng thái</th>
                                        <th>Hiển thị</th>
                                        <th>Credits</th>
                                        <th>Lượt dùng</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <b className="data-table__strong">{s.name}</b>
                                                <div className="data-table__muted">{s.slug}</div>
                                            </td>
                                            <td>
                                                <span className="status-tag neutral">
                                                    {(CATEGORY_MAP[s.category] || CATEGORY_MAP.pdf).short}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-tag ${s.status === "ready" ? "success" : "coming-soon"}`}>
                                                    {s.status === "ready" ? "Sẵn sàng" : "Sắp ra mắt"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-tag ${s.visible ? "success" : "neutral"}`}>
                                                    {s.visible ? "Hiện" : "Đang ẩn"}
                                                </span>
                                            </td>
                                            <td>{s.creditCost}</td>
                                            <td>{s.uses.toLocaleString("vi-VN")}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button type="button" className="btn ghost btn--sm" onClick={() => openEdit(s)}>
                                                        Sửa
                                                    </button>
                                                    <button type="button" className="btn ghost btn--sm"
                                                        disabled={busyId === s.id} onClick={() => handleToggleVisible(s)}>
                                                        {s.visible ? "Ẩn" : "Hiện"}
                                                    </button>
                                                    <button type="button" className="btn ghost btn--sm btn--danger"
                                                        disabled={busyId === s.id} onClick={() => handleDelete(s)}>
                                                        Xoá
                                                    </button>
                                                </div>
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