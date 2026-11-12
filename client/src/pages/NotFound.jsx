import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <section className="page">
            <div className="container">
                <div className="panel notfound-box">
                    <span className="notfound-box__code">404</span>
                    <h1 className="notfound-box__title">Không tìm thấy trang yêu cầu</h1>
                    <p className="notfound-box__sub">
                        Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác.
                    </p>
                    <div className="notfound-box__actions">
                        <Link className="btn" to="/">Về trang chủ</Link>
                        <Link className="btn ghost" to="/services">Khám phá dịch vụ</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}