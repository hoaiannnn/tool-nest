import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ICONS } from "../components/ServiceCard";
import { CATEGORY_MAP } from "../data/servicesData";
import { useServices } from "../lib/useServices";

export default function ServiceDetail() {
    const { id } = useParams();
    const services = useServices();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (services === null) {
        return (
            <section className="page">
                <div className="container">
                    <div className="empty-box">Đang tải...</div>
                </div>
            </section>
        );
    }

    const service = services.find((s) => s.id === Number(id));

    if (!service) {
        return (
            <section className="page">
                <div className="container">
                    <h1 className="page-header__title">Không tìm thấy dịch vụ</h1>
                    <Link className="btn" to="/services">Về danh sách dịch vụ</Link>
                </div>
            </section>
        );
    }

    const cat = CATEGORY_MAP[service.category];
    const ready = service.status === "ready";

    const relatedServices = services
        .filter((s) => s.category === service.category && s.id !== service.id)
        .slice(0, 3);
    
    return (
        <section className="page">
            <div className="container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Trang chủ</Link>
                <span>/</span>
                <Link to="/services">Dịch vụ</Link>
                <span>/</span>
                <span>{service.name}</span>
                </nav>

                <div className="detail-layout">
                <div className="detail-panel">
                    <div className={`detail-head color-${service.category}`}>
                    <span className="tool-icon tool-icon--lg">
                        <svg className="icon" viewBox="0 0 24 24">
                        {ICONS[service.category]}
                        </svg>
                    </span>

                    <div>
                        <h1 className="detail-head__title">{service.name}</h1>
                        <div className="detail-head__tags">
                        <span className="status-tag neutral">{cat.short}</span>
                        <span className={`status-tag ${ready ? "success" : "coming-soon"}`}>
                            {ready ? "Sẵn sàng" : "Sắp ra mắt"}
                        </span>
                        </div>
                    </div>
                    </div>

                    <p className="detail-lead">
                    {service.desc} Xử lý ngay trong trình duyệt, không cần cài đặt phần mềm.
                    </p>

                    <h3 className="detail-subheading">Cách sử dụng</h3>
                    <ol className="detail-list">
                    <li>Đăng nhập vào tài khoản của bạn.</li>
                    <li>Tải {cat.verb} lên hoặc nhập nội dung cần xử lý.</li>
                    <li>Chọn tuỳ chọn và bấm xử lý, sau đó tải kết quả về.</li>
                    </ol>

                    <h3 className="detail-subheading">Điểm nổi bật</h3>
                    <ul className="detail-list">
                    <li>Miễn phí, không giới hạn số lần dùng.</li>
                    <li>Dùng được trên điện thoại và máy tính.</li>
                    </ul>
                </div>

                <aside className="detail-panel detail-aside">
                    <h3 className="detail-aside__title">Sẵn sàng dùng thử?</h3>
                    <p className="detail-aside__note">
                    {service.uses > 0
                        ? `${service.uses.toLocaleString("vi-VN")} lượt dùng.`
                        : "Dịch vụ mới, chưa có lượt dùng."}
                    </p>

                    <Link className="btn btn--full" to={`/tool/${service.id}`}>
                    {ready ? "Sử dụng dịch vụ" : "Xem giao diện thử"}
                    </Link>

                    {relatedServices.length > 0 && (
                    <div className="related-block">
                        <h4 className="related-block__title">Dịch vụ liên quan</h4>
                        <ul className="related-list">
                        {relatedServices.map((rel) => (
                            <li key={rel.id}>
                                <Link to={`/services/${rel.id}`}>{rel.name}
                                    <span>&rarr;</span>
                                </Link>
                            </li>
                        ))}
                        </ul>
                    </div>
                    )}
                </aside>
                </div>
            </div>
        </section>
    );
}