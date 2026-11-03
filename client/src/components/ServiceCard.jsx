import { Link } from "react-router-dom";

export const ICONS = {
  pdf: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  img: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  vid: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  ai: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  file: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <path d="M14 17.5h7M17.5 14v7" />
    </>
  ),
};

export default function ServiceCard({
  id,
  name,
  desc,
  status = "ready",
  category = "pdf",
}) {
  const ready = status === "ready";

  return (
    <Link to={`/services/${id}`} className={`tool-card color-${category}`}>
      <div className="tool-card__top">
        <span className="tool-icon">
          <svg className="icon" viewBox="0 0 24 24">{ICONS[category]}</svg>
        </span>
        <span className={`status-tag ${ready ? "success" : "coming-soon"}`}>
          {ready ? "Sẵn sàng" : "Sắp ra mắt"}
        </span>
      </div>

      <h3 className="tool-card__heading">{name}</h3>
      <p className="tool-card__desc">{desc}</p>
      <span className="tool-card__link">Xem chi tiết &rarr;</span>
    </Link>
  );
}