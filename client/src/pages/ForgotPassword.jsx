import { useState } from "react";
import { Link } from "react-router-dom";
import logoImg from "../assets/image/logo-img.png";
import { fetchApi } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(res.message || "Đã gửi hướng dẫn qua email.");
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

        <h1 className="auth__title">Quên mật khẩu</h1>
        <p className="auth__sub">Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="forgot-email">Email</label>
            <div className="auth-field__box">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                id="forgot-email"
                type="email"
                placeholder="ban@example.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button className="btn auth__submit" type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi liên kết"}
          </button>
        </form>

        <p className="auth__switch">
          Nhớ ra rồi? <Link className="auth__switch-link" to="/login">Đăng nhập</Link>
        </p>
      </div>

      <Link className="auth__back" to="/">&larr; Về trang chủ</Link>
    </section>
  );
}