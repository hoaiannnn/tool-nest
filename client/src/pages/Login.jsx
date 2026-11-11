import { Link, useNavigate } from "react-router-dom";
import logoImg from "../assets/image/logo-img.png";
import { fetchApi } from "../lib/api";
import { useState } from "react";

export default function Login({setUser}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password
        }),
      });
      setUser(res.data);
      navigate(res.data.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <Link className="auth__logo" to="/">
          <img className="auth__logo-img" src={logoImg} alt="" />
          ToolNest
        </Link>

        <h1 className="auth__title">Chào mừng trở lại</h1>
        <p className="auth__sub">Đăng nhập để dùng dịch vụ.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="login-email">Email</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="login-email"
                type="email"
                placeholder="ban@example.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="login-password">Mật khẩu</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="login-password"
                type="password"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn auth__submit" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p className="auth__switch">
          Chưa có tài khoản? <Link className="auth__switch-link" to="/register">Đăng ký</Link>
        </p>
      </div>

      <Link className="auth__back" to="/">&larr; Về trang chủ</Link>
    </section>
  );
}