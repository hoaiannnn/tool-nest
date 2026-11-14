import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import logoImg from "../assets/image/logo-img.png";
import { fetchApi } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
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

        {!token ? (
          <>
            <h1 className="auth__title">Liên kết không hợp lệ</h1>
            <p className="auth__sub">Liên kết thiếu mã xác nhận. Hãy yêu cầu liên kết mới.</p>
            <p className="auth__switch">
              <Link className="auth__switch-link" to="/forgot-password">Yêu cầu liên kết mới</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth__title">Đặt mật khẩu mới</h1>
            <p className="auth__sub">Nhập mật khẩu mới cho tài khoản của bạn.</p>

            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-field__label" htmlFor="reset-password">Mật khẩu mới</label>
                <div className="auth-field__box">
                  <svg className="icon" viewBox="0 0 24 24">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <input
                    id="reset-password"
                    type="password"
                    placeholder="Ít nhất 8 ký tự"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="reset-confirm">Nhập lại mật khẩu</label>
                <div className="auth-field__box">
                  <svg className="icon" viewBox="0 0 24 24">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <input
                    id="reset-confirm"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}
              {done && <p className="form-success">Thành công! Đang chuyển về trang đăng nhập...</p>}

              <button className="btn auth__submit" type="submit" disabled={loading || done}>
                {loading ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
            </form>
          </>
        )}
      </div>

      <Link className="auth__back" to="/">&larr; Về trang chủ</Link>
    </section>
  );
}