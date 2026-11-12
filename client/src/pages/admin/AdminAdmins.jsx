import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

const EMPTY_FORM = { fullName: "", email: "", password: "", phone: "" };

export default function AdminAdmins() {
    const [admins, setAdmins] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        return fetchApi("/admin/admins")
            .then((res) => setAdmins(res.data))
            .catch((err) => setError(err.message));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (form.fullName.trim().length < 2) return setError("Họ tên phải từ 2 ký tự trở lên.");
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Email không hợp lệ.");
        if (form.password.length < 8) return setError("Mật khẩu tối thiểu 8 ký tự.");

        setSaving(true);
        try {
            const res = await fetchApi("/admin/admins", {
                method: "POST",
                body: JSON.stringify(form),
            });
            setNotice(res.message);
            setForm(EMPTY_FORM);
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1 className="admin-header__title">Quản trị viên</h1>
                    <p className="admin-header__sub">Danh sách và tạo mới tài khoản có quyền quản trị.</p>
                </div>
            </div>

            <div className="panel admin-section">
                <div className="admin-panel-head">
                    <h2 className="admin-panel-title">Tạo quản trị viên mới</h2>
                </div>

                <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="profile-form__row">
                        <div className="tool-field">
                            <label className="tool-field__label" htmlFor="ad-name">Họ và tên</label>
                            <input id="ad-name" name="fullName" type="text" className="tool-field__control"
                                value={form.fullName} onChange={handleChange} />
                        </div>
                        <div className="tool-field">
                            <label className="tool-field__label" htmlFor="ad-email">Email</label>
                            <input id="ad-email" name="email" type="email" className="tool-field__control"
                                value={form.email} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="profile-form__row">
                        <div className="tool-field">
                            <label className="tool-field__label" htmlFor="ad-pass">Mật khẩu</label>
                            <input id="ad-pass" name="password" type="password" className="tool-field__control"
                                value={form.password} onChange={handleChange} placeholder="Tối thiểu 8 ký tự"
                                autoComplete="new-password" />
                        </div>
                        <div className="tool-field">
                            <label className="tool-field__label" htmlFor="ad-phone">Số điện thoại (tuỳ chọn)</label>
                            <input id="ad-phone" name="phone" type="tel" className="tool-field__control"
                                value={form.phone} onChange={handleChange} />
                        </div>
                    </div>

                    {error && <p className="form-error">{error}</p>}
                    {notice && <p className="form-success">{notice}</p>}

                    <div className="profile-form__actions">
                        <button type="submit" className="btn" disabled={saving}>
                            {saving ? "Đang tạo..." : "Tạo quản trị viên"}
                        </button>
                    </div>
                </form>
            </div>

            {admins === null && !error ? (
                <div className="empty-box">Đang tải...</div>
            ) : (
                <div className="panel table-panel">
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Quản trị viên</th>
                                    <th>Điện thoại</th>
                                    <th>Ngày tạo</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(admins || []).map((a) => (
                                    <tr key={a.id}>
                                        <td>
                                            <b className="data-table__strong">{a.fullName}</b>
                                            <div className="data-table__muted">{a.email}</div>
                                        </td>
                                        <td className="data-table__muted">{a.phone || "-"}</td>
                                        <td className="data-table__muted">{formatDateTime(a.createdAt)}</td>
                                        <td>
                                            <span className={`status-tag ${a.status === "locked" ? "coming-soon" : "success"}`}>
                                                {a.status === "locked" ? "Đã khoá" : "Hoạt động"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}