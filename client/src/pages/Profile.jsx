import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "../lib/api";

function getInitials(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PLAN_LABEL = {
    free: "Free",
    pro: "Pro",
    team: "Team"
}

export default function Profile({ user, setUser }) {
    const [form, setForm] = useState({
        fullName: user.full_name || "",
        birthYear: user.birth_year || "",
        phone: user.phone || "",
        address: user.address || "",    
    });

    const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

    const [savingProfile, setSavingProfile] = useState(false);

    const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
    const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
    const [savingPw, setSavingPw] = useState(false);

    const planLabel = PLAN_LABEL[user.plan_type] || PLAN_LABEL.free;

    function handleFormChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handlePwChange(e) {
        setPw((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    
    async function handleSaveProfile(e) {
        e.preventDefault();
        setProfileMsg({
            type: "",
            text: ""
        });

        if (form.fullName.trim().length < 2) {
            return setProfileMsg({
                type: "error",
                text: "Họ tên phải từ 2 ký tự trở lên."
            });
        }

        const year = form.birthYear ? Number(form.birthYear) : null;
        if (year && (year < 1920 || year > new Date().getFullYear())) {
            return setProfileMsg({
                type: "error",
                text: "Năm sinh không hợp lệ."
            });
        }

         setSavingProfile(true)
        
        try {
            const res = await fetchApi("/auth/profile", {
                method: "PUT",
                body: JSON.stringify({
                    fullName: form.fullName,
                    birthYear: year,
                    phone: form.phone,
                    address: form.address,
                }),
            });

            setUser(res.data);
            setProfileMsg({
                type: "success",
                text: "Đã lưu thông tin cá nhân."
            });
        } catch (err) {
            setProfileMsg({
                type: "error",
                text: err.message
            });
        } finally {
            setSavingProfile(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setPwMsg({ type: "", text: "" });

        if (!pw.current || !pw.next) {
            return setPwMsg({ type: "error", text: "Vui lòng nhập đủ các ô mật khẩu." });
        }

        if (pw.next.length < 8) {
            return setPwMsg({ type: "error", text: "Mật khẩu mới tối thiểu 8 ký tự." });
        }

        if (pw.next !== pw.confirm) {
            return setPwMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
        }

        setSavingPw(true);
        try {
            await fetchApi("/auth/change-password", {
                 method: "PUT",
                body: JSON.stringify({
                    currentPassword: pw.current,
                    newPassword: pw.next,
                }),
            });
            setPw({ current: "", next: "", confirm: "" });
            setPwMsg({ type: "success", text: "Đổi mật khẩu thành công." });
        } catch (err) {
            setPwMsg({ type: "error", text: err.message });
        } finally {
            setSavingPw(false);
        }
    }

    return (
        <section className="page">
            <div className="container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <span>Hồ sơ cá nhân</span>
                </nav>

                <div className="page-header">
                    <h1 className="page-header__title">Hồ sơ cá nhân</h1>
                    <p className="page-header__sub">
                        Quản lý thông tin tài khoản, theo dõi gói dịch vụ và bảo mật mật khẩu của bạn.
                    </p>
                </div>

                <div className="profile-grid">
                    <aside className="panel profile-card">
                        <div className="profile-card__avatar">{getInitials(user.full_name)}</div>
                        <h2 className="profile-card__name">{user.full_name}</h2>
                        <p className="profile-card__email">{user.email}</p>

                        <div className="profile-card__badges">
                            <span className="status-tag neutral">{planLabel}</span>
                            <span className="status-tag success">
                                {user.role === "admin" ? "Quản trị viên" : "Đang hoạt động"}
                            </span>
                        </div>

                        <div className="profile-stats">
                            <div className="profile-stats__item">
                                <span className="profile-stats__label">Credits còn lại</span>
                                <b className="profile-stats__value">{user.credits ?? 0}</b>
                            </div>
                            <div className="profile-stats__item">
                                <span className="profile-stats__label">Gói hiện tại</span>
                                <b className="profile-stats__value">{planLabel}</b>
                            </div>
                        </div>

                        <div className="profile-card__actions">
                            <Link className="btn profile-card__btn" to="/plans">Nâng cấp gói dịch vụ</Link>
                        </div>
                    </aside>

                    <div className="profile-main">
                        <div className="panel">
                            <h3 className="profile-section-title">Thông tin cơ bản</h3>
                            <p className="profile-section-sub">Cập nhật họ tên, năm sinh và thông tin liên hệ.</p>

                            <form className="profile-form" onSubmit={handleSaveProfile}>
                                <div className="profile-form__row">
                                    <div className="tool-field">
                                        <label className="tool-field__label" htmlFor="pf-name">Họ và tên</label>
                                        <input id="pf-name" name="fullName" type="text" className="tool-field__control"
                                            value={form.fullName} onChange={handleFormChange} placeholder="Nhập họ và tên..." />
                                    </div>
                                    <div className="tool-field">
                                        <label className="tool-field__label" htmlFor="pf-email">Email đăng nhập</label>
                                        <input id="pf-email" type="email" className="tool-field__control"
                                            value={user.email} disabled />
                                    </div>
                                </div>

                                <div className="profile-form__row">
                                    <div className="tool-field">
                                        <label className="tool-field__label" htmlFor="pf-year">Năm sinh</label>
                                        <input id="pf-year" name="birthYear" type="number" className="tool-field__control"
                                            value={form.birthYear} onChange={handleFormChange} placeholder="Ví dụ: 2004" />
                                    </div>
                                    <div className="tool-field">
                                        <label className="tool-field__label" htmlFor="pf-phone">Số điện thoại</label>
                                        <input id="pf-phone" name="phone" type="tel" className="tool-field__control"
                                            value={form.phone} onChange={handleFormChange} placeholder="Ví dụ: 0912345678" />
                                    </div>
                                </div>

                                <div className="tool-field">
                                    <label className="tool-field__label" htmlFor="pf-address">Địa chỉ</label>
                                    <input id="pf-address" name="address" type="text" className="tool-field__control"
                                        value={form.address} onChange={handleFormChange} placeholder="Nhập địa chỉ của bạn..." />
                                </div>

                                {profileMsg.text && (
                                    <p className={profileMsg.type === "error" ? "form-error" : "form-success"}>
                                        {profileMsg.text}
                                    </p>
                                )}

                                <div className="profile-form__actions">
                                    <button type="submit" className="btn" disabled={savingProfile}>
                                        {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="panel">
                            <h3 className="profile-section-title">Đổi mật khẩu</h3>
                            <p className="profile-section-sub">Dùng mật khẩu tối thiểu 8 ký tự để bảo vệ tài khoản.</p>

                            <form className="profile-form" onSubmit={handleChangePassword}>
                                <div className="tool-field">
                                    <label className="tool-field__label" htmlFor="pw-old">Mật khẩu hiện tại</label>
                                    <input id="pw-old" name="current" type="password" className="tool-field__control"
                                        value={pw.current} onChange={handlePwChange} autoComplete="current-password"
                                        placeholder="Nhập mật khẩu hiện tại..." />
                                </div>
                                <div className="profile-form__row">
                                    <div className="tool-field">
                                        <label className="tool-field__label" htmlFor="pw-new">Mật khẩu mới</label>
                                        <input id="pw-new" name="next" type="password" className="tool-field__control"
                                            value={pw.next} onChange={handlePwChange} autoComplete="new-password"
                                            placeholder="Tối thiểu 8 ký tự" />
                                    </div>
                                    <div className="tool-field">
                                        <label className="tool-field__label" htmlFor="pw-confirm">Xác nhận mật khẩu mới</label>
                                        <input id="pw-confirm" name="confirm" type="password" className="tool-field__control"
                                            value={pw.confirm} onChange={handlePwChange} autoComplete="new-password"
                                            placeholder="Nhập lại mật khẩu mới" />
                                    </div>
                                </div>

                                {pwMsg.text && (
                                    <p className={pwMsg.type === "error" ? "form-error" : "form-success"}>
                                        {pwMsg.text}
                                    </p>
                                )}

                                <div className="profile-form__actions">
                                    <button type="submit" className="btn" disabled={savingPw}>
                                        {savingPw ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}