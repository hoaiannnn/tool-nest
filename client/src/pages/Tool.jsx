import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ICONS } from "../components/ServiceCard";
import { CATEGORY_MAP } from "../data/servicesData";
import { useServices } from "../lib/useServices";

export default function Tool() {
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

    const category = CATEGORY_MAP[service.category] || CATEGORY_MAP.pdf;
    const slug = service.slug || "";
    const isAiTool = service.category === "ai";
    const ready = service.status === "ready";
    const credit = service.credit ?? 0;

    const isConvert = slug.includes("convert");
    const isCompress = slug.includes("compress");
    const isMerge = slug === "merge-pdf";
    const isSummarizer = slug === "ai-summarizer";

    return (
        <section className="page">
            <div className="container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Trang chủ</Link>
                <span>/</span>
                <Link to="/services">Dịch vụ</Link>
                <span>/</span>
                <Link to={`/services/${service.id}`}>{service.name}</Link>
                <span>/</span>
                <span>Sử dụng</span>
                </nav>

                <div className="tool-header">
                <div className={`tool-header__info color-${service.category}`}>
                    <span className="tool-icon tool-icon--lg">
                    <svg className="icon" viewBox="0 0 24 24">
                        {ICONS[service.category]}
                    </svg>
                    </span>
                    <div>
                    <div className="tool-header__title-row">
                        <h1 className="tool-header__title">{service.name}</h1>
                        <span className={`status-tag ${ready ? "success" : "coming-soon"}`}>
                        {ready ? "Sẵn sàng" : "Bản xem trước"}
                        </span>
                    </div>
                    <p className="tool-header__sub">{service.desc}</p>
                    </div>
                </div>

                <Link className="btn ghost" to={`/services/${service.id}`}>
                    &larr; Chi tiết dịch vụ
                </Link>
                </div>

                <div className="workspace-grid">
                <div className="detail-panel workspace-main">
                    <h2 className="workspace-section-title">
                    {isAiTool ? "1. Nhập nội dung đầu vào" : `1. Tải ${category.verb} lên`}
                    </h2>

                    {isAiTool ? (
                    <div className="ai-box">
                        <textarea
                        className="ai-box__input"
                        rows={7}
                        placeholder={
                            isSummarizer
                            ? "Dán bài viết dài bạn muốn tóm tắt vào đây..."
                            : "Nhập hoặc dán văn bản cần xử lý vào đây..."
                        }
                        />
                        <div className="ai-box__meta">
                        <span>0 ký tự</span>
                        <span>Hỗ trợ Tiếng Việt và Tiếng Anh</span>
                        </div>
                    </div>
                    ) : (
                    <>
                        <label className="dropzone" htmlFor="tool-file-input">
                        <input
                            id="tool-file-input"
                            type="file"
                            className="dropzone__input"
                            accept={category.accept}
                            multiple={isMerge}
                        />
                        <span className="dropzone__icon">
                            <svg className="icon" viewBox="0 0 24 24">
                            <path d="M12 16V4m0 0-4 4m4-4 4 4" />
                            <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
                            </svg>
                        </span>
                        <b className="dropzone__title">
                            Kéo thả {category.verb} vào đây hoặc bấm để chọn tệp
                        </b>
                        <span className="dropzone__hint">Tối đa 25MB mỗi tệp</span>
                        </label>

                        <div className="file-list">
                        <div className="file-item">
                            <div className="file-item__info">
                            <span className="file-item__badge">{category.short}</span>
                            <div>
                                <b className="file-item__name">tai-lieu-mau.png</b>
                                <small className="file-item__size">1.24 MB • Sẵn sàng xử lý</small>
                            </div>
                            </div>
                            <button type="button" className="btn ghost file-item__remove">
                            Xoá
                            </button>
                        </div>
                        </div>
                    </>
                    )}

                    <div className="result-box">
                    <div className="result-box__head">
                        <b className="result-box__title">Kết quả xử lý</b>
                        <span className="status-tag neutral">Chưa chạy</span>
                    </div>
                    <p className="result-box__empty">
                        Chọn tuỳ chọn ở cột bên phải và bấm <b>"Bắt đầu xử lý"</b> để nhận kết quả tại đây.
                    </p>
                    </div>
                </div>

                <aside className="detail-panel workspace-aside">
                    <h2 className="workspace-section-title">2. Tuỳ chọn xử lý</h2>

                    <div className="tool-options">
                    {isConvert && (
                        <div className="tool-field">
                        <label className="tool-field__label" htmlFor="opt-format">Định dạng đầu ra</label>
                        <select id="opt-format" className="tool-field__control" defaultValue="webp">
                            <option value="webp">WebP (nhẹ, tối ưu web)</option>
                            <option value="jpg">JPG (phổ biến)</option>
                            <option value="png">PNG (giữ nền trong suốt)</option>
                        </select>
                        </div>
                    )}

                    {isCompress && (
                        <div className="tool-field">
                        <label className="tool-field__label" htmlFor="opt-level">Mức độ nén</label>
                        <select id="opt-level" className="tool-field__control" defaultValue="balanced">
                            <option value="balanced">Cân bằng (khuyên dùng)</option>
                            <option value="high">Nén mạnh (dung lượng nhỏ nhất)</option>
                            <option value="light">Nén nhẹ (ưu tiên độ nét)</option>
                        </select>
                        </div>
                    )}

                    {isSummarizer && (
                        <div className="tool-field">
                        <label className="tool-field__label" htmlFor="opt-tone">Giọng điệu văn bản</label>
                        <select id="opt-tone" className="tool-field__control" defaultValue="pro">
                            <option value="pro">Chuyên nghiệp, rõ ràng</option>
                            <option value="academic">Học thuật, báo cáo</option>
                            <option value="friendly">Tự nhiên, gần gũi</option>
                        </select>
                        </div>
                    )}

                    <div className="tool-field">
                        <label className="tool-field__label" htmlFor="opt-name">Tên tệp kết quả</label>
                        <input
                        id="opt-name"
                        type="text"
                        className="tool-field__control"
                        placeholder="Tuỳ chọn tên tệp đầu ra..."
                        defaultValue="toolnest-ket-qua"
                        />
                    </div>
                    </div>

                    <div className="tool-summary">
                    <div className="tool-summary__row">
                        <span>Chi phí lượt dùng</span>
                        <b>{credit > 0 ? `${credit} Credit` : "Miễn phí"}</b>
                    </div>
                    <div className="tool-summary__row">
                        <span>Thời gian dự kiến</span>
                        <b>~2 giây</b>
                    </div>
                    </div>

                    <button type="button" className="btn workspace-aside__submit" disabled={!ready}>
                    {ready ? "Bắt đầu xử lý" : "Sắp ra mắt"}
                    </button>
                    <button type="button" className="btn ghost workspace-aside__reset">
                    Làm mới
                    </button>
                </aside>
                </div>
            </div>
        </section>
    )
}