import { Link, NavLink, useNavigate } from "react-router-dom";
import { fetchApi } from "../lib/api";
import logoImg from "../assets/image/logo-img.png";

const navClass = ({isActive}) => 
        isActive ? "navbar__item chose" : "navbar__item";

function getInitials(name = "") {
    const words = name.trim().split(/\s+/);
    if (!words[0]) return "U";

    return (
        words.length > 1
        ? words[0][0] + words[words.length - 1][0]
        : words[0].slice(0, 2)
    ).toUpperCase();
}

export default function Header({ user, setUser}) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await fetchApi("/auth/logout", {method: "POST"});
            setUser(null);
            navigate("/login");
        } catch (err) {
            console.error("Lỗi đăng xuất:", err);
        }
    }


    return (
        <header className="header">
        <div className="container">
            <Link className="logo" to="/">
                <img className="logo__img" src={logoImg} alt="ToolNest" />
                ToolNest
            </Link>

            <nav className="navbar" aria-label="Điều hướng chính">
                <NavLink to="/" className={navClass} end>Trang chủ</NavLink>
                <NavLink to="/services" className={navClass}>Dịch vụ</NavLink>
                <NavLink to="/plans" className={navClass}>Gói dịch vụ</NavLink>
            </nav>

            <span className="spacer"></span>

            <div className="header-action">
                {user ? (
                    <>
                        <Link className="header-user" to="/profile" title="Tài khoản">
                            <span className="header-user__avatar">{getInitials(user.full_name)}</span>
                            <span className="header-user__name">{user.full_name}</span>
                        </Link>
                        {user.role === "admin" && (
                            <Link className="btn ghost header-action__link" to="/admin">Quản trị</Link>
                        )}
                        <button type="button" className="btn ghost header-action__link" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <Link className="btn ghost header-action__link" to="/login">Đăng nhập</Link>
                        <Link className="btn header-action__link" to="/register">Đăng ký</Link>
                    </>
                )}
            </div>
        </div>
    </header>
    )
}
