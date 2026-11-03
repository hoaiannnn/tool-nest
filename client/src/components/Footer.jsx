import { Link } from "react-router-dom"

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__left">
                    <b className="footer__heading">ToolNest</b>
                    <p className="footer__desc">Dự án môn Lập trình web, Học viện Công nghệ Bưu chính Viễn thông.</p>
                </div>
                <ul className="footer__list">
                    <li className="footer__item">
                        <Link className="footer__link" to="/">Giới thiệu</Link>
                    </li>
                    <li className="footer__item">
                        <Link className="footer__link" to="/services">Dịch vụ</Link>
                    </li>
                    <li className="footer__item">
                        <Link className="footer__link" to="/plans">Gói dịch vụ</Link>
                    </li>
                    <li className="footer__item">
                        <Link className="footer__link" to="/">Liên hệ</Link>
                    </li>
                    <li className="footer__item">
                        <Link className="footer__link" to="/">Điều khoản</Link>
                    </li>
                </ul>
            </div>
        </footer>
    )
}