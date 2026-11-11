import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ServiceCard, { ICONS } from "../components/ServiceCard";
import { CATEGORIES } from "../data/servicesData";
import { useServices } from "../lib/useServices";

const RECENT = ["PDF sang JPG", "Tắt tiếng video", "Nén ảnh"];

const STEPS = [
  { title: "Chọn công cụ", text: "Tìm theo tên hoặc mở đúng danh mục bạn cần." },
  { title: "Tải tệp lên", text: "Kéo thả tệp vào khung và chọn tuỳ chọn xử lý." },
  { title: "Tải kết quả về", text: "Nhận tệp đã xử lý." },
];

export default function Home() {
  const navigate = useNavigate();
  const services = useServices() ?? [];
  const [wordIndex, setWordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const countByCategory = (id) => services.filter((s) => s.category === id).length;

  const popular = [...services]
    .filter((s) => s.status === "ready")
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 6);
    
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.trim();
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : "/services");
  };

  return (
    <section className="home">
      <div className="container">
        <div className="home-recent">
          <b className="home-recent__label">Dùng gần đây:</b>
          {RECENT.map((q) => (
            <Link key={q} className="home-recent__chip" to={`/services?q=${encodeURIComponent(q)}`}>
              {q}
            </Link>
          ))}
        </div>

        <div className="home-hero">
          <h1 className="home-hero__title">
            Công cụ miễn phí giúp{" "}
            <span className="home-hero__highlight">
                Học tập
            </span>{" "}
            đơn giản
          </h1>
          <p className="home-hero__desc">
            PDF, ảnh, video, văn bản và tệp dữ liệu. Mở trình duyệt là dùng được, không cần cài đặt.
          </p>
          <form className="home-hero__search" onSubmit={handleSearchSubmit} role="search">
            <input
              className="home-hero__input"
              type="search"
              name="q"
              placeholder="Tìm công cụ, ví dụ: gộp PDF, nén ảnh..."
              aria-label="Tìm công cụ"
            />
            <button className="btn" type="submit">Tìm kiếm</button>
          </form>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.id} className={`category-card color-${c.id}`} to={`/services?cat=${c.id}`}>
              <div className="category-card__head">
                <div className="category-card__row">
                  <span className="category-card__icon">
                    <svg className="icon" viewBox="0 0 24 24">{ICONS[c.id]}</svg>
                  </span>
                  <span className="category-card__count">{countByCategory(c.id)} công cụ</span>
                </div>
                <div>
                  <h3 className="category-card__title">{c.name}</h3>
                  <small className="category-card__sub">{c.sub}</small>
                </div>
              </div>
              <div className="category-card__feature">
                <span>Nổi bật</span>
                <b className="category-card__feature-name">{c.feature}</b>
              </div>
            </Link>
          ))}
        </div>

        <div className="section-head">
          <h2 className="section-head__title">Công cụ được dùng nhiều</h2>
          <Link className="btn ghost" to="/services">Xem tất cả dịch vụ</Link>
        </div>
        <div className="tool-grid">
          {popular.map((s) => (
            <ServiceCard key={s.id} {...s} />
          ))}
        </div>

        <div className="section-head">
          <h2 className="section-head__title">Dùng trong ba bước</h2>
        </div>
        <div className="step-list">
          {STEPS.map((s) => (
            <div key={s.title} className="step-card">
              <h3 className="step-card__title">{s.title}</h3>
              <p className="step-card__text">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="home-cta">
          <h2 className="home-cta__title">Tạo tài khoản ToolNest</h2>
          <p className="home-cta__desc">
            Đăng ký miễn phí. Công cụ bạn dùng gần đây luôn nằm sẵn ở đầu trang.
          </p>
          <Link className="btn home-cta__btn" to="/register">Đăng ký miễn phí</Link>
        </div>
      </div>
    </section>
  );
}