import { Link } from "react-router-dom";
import ServiceCard, { ICONS } from "../components/ServiceCard";
import { useState, useEffect } from "react";

const RECENT = ["PDF sang JPG", "Tắt tiếng video", "Nén ảnh"];

const CATEGORIES = [
  { id: "pdf", name: "Công cụ PDF", sub: "Giải quyết việc với PDF", count: 4, feature: "Gộp PDF" },
  { id: "img", name: "Công cụ ảnh", sub: "Giải quyết việc với ảnh", count: 3, feature: "Nén ảnh" },
  { id: "vid", name: "Công cụ video", sub: "Giải quyết việc với video", count: 2, feature: "Tắt tiếng" },
  { id: "ai", name: "AI viết", sub: "Giải quyết việc với văn bản", count: 2, feature: "Viết đoạn văn" },
  { id: "file", name: "Công cụ tệp", sub: "Giải quyết việc với tệp", count: 2, feature: "CSV sang Excel" },
];

const POPULAR = [
  { id: 5, name: "Nén ảnh", desc: "Giảm dung lượng ảnh, giữ chất lượng.", status: "ready", category: "img" },
  { id: 1, name: "Gộp PDF", desc: "Ghép nhiều tệp PDF thành một tệp.", status: "ready", category: "pdf" },
  { id: 11, name: "Viết đoạn văn", desc: "Nhập ý chính, nhận đoạn văn hoàn chỉnh.", status: "ready", category: "ai" },
  { id: 6, name: "Đổi định dạng ảnh", desc: "Chuyển qua lại giữa PNG, JPG và WebP.", status: "ready", category: "img" },
  { id: 12, name: "Tóm tắt văn bản", desc: "Rút gọn bài dài thành vài câu chính.", status: "ready", category: "ai" },
  { id: 2, name: "Tách PDF", desc: "Chọn trang cần tách ra khỏi tệp PDF.", status: "ready", category: "pdf" },
];

const STEPS = [
  { title: "Chọn công cụ", text: "Tìm theo tên hoặc mở đúng danh mục bạn cần." },
  { title: "Tải tệp lên", text: "Kéo thả tệp vào khung và chọn tuỳ chọn xử lý." },
  { title: "Tải kết quả về", text: "Nhận tệp đã xử lý. Đăng nhập để xem lại lịch sử sử dụng." },
];

const WORDS = ["Học tập", "Công việc", "Tài liệu", "Thiết kế"];

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let timeoutId;

    const intervalId = setInterval(() => {
      setIsFading(true);
      timeoutId = setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        setIsFading(false);
      }, 250);
    }, 2800);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    }
  })

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
            Công cụ miễn phí giúp
            <span className="home-hero__highlight">
              Học tập
            </span>
            đơn giản
          </h1>
          <p className="home-hero__desc">
            PDF, ảnh, video, văn bản và tệp dữ liệu. Mở trình duyệt là dùng được, không cần cài đặt.
          </p>
          <form className="home-hero__search" action="/services" method="get" role="search">
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
                  <span className="category-card__count">{c.count} công cụ</span>
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
          {POPULAR.map((s) => (
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
          <h2 className="home-cta__title">Tạo tài khoản để lưu lịch sử dùng công cụ</h2>
          <p className="home-cta__desc">
            Đăng ký miễn phí. Công cụ bạn dùng gần đây luôn nằm sẵn ở đầu trang.
          </p>
          <Link className="btn home-cta__btn" to="/register">Đăng ký miễn phí</Link>
        </div>
      </div>
    </section>
  );
}