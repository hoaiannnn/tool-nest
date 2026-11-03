import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApi } from "../lib/api";
import logoImg from "../assets/image/logo-img.png";

export default function Register({ setUser }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) return setError("Họ và tên phải có ít nhất 2 ký tự.");
    if (!email.trim()) return setError("Vui lòng nhập email.");
    if (password.length < 8) return setError("Mật khẩu phải từ 8 ký tự trở lên.");
    if (password !== confirm) return setError("Mật khẩu nhập lại chưa khớp.");
    if (!terms) return setError("Bạn cần đồng ý với điều khoản sử dụng.");

    setLoading(true);
    try {
      const res = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }),
      });
      setUser(res.data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth">
      <div className="auth__card">
        <Link className="auth__logo" to="/">
          <img className="auth__logo-img" src={logoImg} alt="" />
          ToolNest
        </Link>

        <h1 className="auth__title">Tạo tài khoản</h1>
        <p className="auth__sub">Miễn phí, mất chưa đến một phút.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reg-name">Họ và tên</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              <input id="reg-name" type="text" placeholder="Nguyễn Văn A" autoComplete="name"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reg-email">Email</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input id="reg-email" type="email" placeholder="ban@example.com" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reg-password">Mật khẩu</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input id="reg-password" type="password" placeholder="Ít nhất 8 ký tự" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reg-confirm">Nhập lại mật khẩu</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input id="reg-confirm" type="password" placeholder="Nhập lại mật khẩu" autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>

          <label className="auth__check">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>Tôi đồng ý với điều khoản sử dụng.</span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="btn auth__submit" type="submit" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="auth__switch">
          Đã có tài khoản? <Link className="auth__switch-link" to="/login">Đăng nhập</Link>
        </p>
      </div>

      <Link className="auth__back" to="/">&larr; Về trang chủ</Link>
    </section>
  );
}