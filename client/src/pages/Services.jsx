import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { CATEGORIES } from "../data/servicesData";
import { useServices } from "../lib/useServices";

const PAGE_SIZE = 6;

function norm(str = "") {
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

export default function Services() {
    const services = useServices();
    const [searchParams, setSearchParams] = useSearchParams();
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [cat, setCat] = useState(searchParams.get("cat") || "");
    const [status, setStatus] = useState("");
    const [sort, setSort] = useState("uses-desc");
    const [page, setPage] = useState(1);
    
    useEffect(() => {
        setQ(searchParams.get("q") || "");
        setCat(searchParams.get("cat") || "");
        setPage(1);
    }, [searchParams]);

    const cleanQ = norm(q.trim());
    const filtered = (services ?? []).filter((item) => {
        if (cleanQ && !norm(item.name).includes(cleanQ) && !norm(item.desc).includes(cleanQ)) {
            return false;
        }
        if (cat && item.category !== cat) return false;
        if (status && item.status !== status) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sort === "uses-desc") return b.uses - a.uses;
        if (sort === "name-asc") return a.name.localeCompare(b.name, "vi");
        if (sort === "name-desc") return b.name.localeCompare(a.name, "vi");
        if (sort === "created-desc") return String(b.created).localeCompare(String(a.created));
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const curPage = Math.min(page, totalPages);
    const fromIndex = (curPage - 1) * PAGE_SIZE;
    const pageItems = sorted.slice(fromIndex, fromIndex + PAGE_SIZE);

    const handleCategoryChange = (e) => {
        const next = e.target.value;
        setCat(next);
        setPage(1);
        const params = {};
        if (q.trim()) params.q = q.trim();
        if (next) params.cat = next;
        setSearchParams(params, { replace: true });
    };

    return (
        <section className="page">
            <div className="container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <span>Dịch vụ</span>
                </nav>

                <h1 className="page-header__title">Danh sách dịch vụ</h1>
                <p className="page-header__sub">
                    Tìm kiếm, lọc theo danh mục hoặc trạng thái và sắp xếp theo tên, mức độ phổ biến, ngày thêm.
                </p>

                <div className="filter-bar">
                    <input
                        type="search"
                        className="filter-bar__search"
                        placeholder="Tìm dịch vụ theo tên hoặc mô tả..."
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                    />

                    <select className="filter-bar__select" value={cat} onChange={handleCategoryChange}>
                        <option value="">Danh mục: tất cả</option>
                        {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.short}</option>
                        ))}
                    </select>

                    <select
                        className="filter-bar__select"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Trạng thái: tất cả</option>
                        <option value="ready">Sẵn sàng</option>
                        <option value="soon">Sắp ra mắt</option>
                    </select>

                    <select
                        className="filter-bar__select"
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="uses-desc">Sắp xếp: Phổ biến nhất</option>
                        <option value="name-asc">Sắp xếp: Tên A đến Z</option>
                        <option value="name-desc">Sắp xếp: Tên Z đến A</option>
                        <option value="created-desc">Sắp xếp: Mới thêm</option>
                    </select>
                </div>

                {services === null ? (
                    <div className="empty-box">Đang tải danh sách dịch vụ...</div>
                ) : pageItems.length === 0 ? (
                    <div className="empty-box">Không có kết quả phù hợp. Thử đổi từ khoá hoặc bộ lọc.</div>
                ) : (
                    <div className="tool-grid">
                        {pageItems.map((s) => (
                            <ServiceCard key={s.id} {...s} />
                        ))}
                    </div>
                )}

                <div className="pagination">
                    <span className="pagination__info">
                        {sorted.length > 0
                            ? `Hiển thị ${fromIndex + 1}-${fromIndex + pageItems.length} trên ${sorted.length}`
                            : "0 kết quả"}
                    </span>

                    <div className="pagination__controls">
                        <button
                            type="button"
                            className="pagination__btn"
                            disabled={curPage === 1}
                            aria-label="Trang trước"
                            onClick={() => setPage(curPage - 1)}
                        >
                            &lsaquo;
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                type="button"
                                className={`pagination__btn ${num === curPage ? "is-active" : ""}`}
                                aria-current={num === curPage ? "page" : undefined}
                                onClick={() => setPage(num)}
                            >
                                {num}
                            </button>
                        ))}

                        <button
                            type="button"
                            className="pagination__btn"
                            disabled={curPage === totalPages}
                            aria-label="Trang sau"
                            onClick={() => setPage(curPage + 1)}
                        >
                            &rsaquo;
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}