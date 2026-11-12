export default function Pager({ page, pageSize, total, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    const from = Math.max(1, page - 2);
    const to = Math.min(totalPages, page + 2);
    const numbers = [];
    for (let n = from; n <= to; n++) numbers.push(n);

    return (
        <div className="pager">
            <span className="pager__info">
                Hiển thị {start}-{end} trên {total}
            </span>
            <div className="pager__pages">
                <button type="button" className="pager__btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
                    &lsaquo;
                </button>
                {numbers.map((n) => (
                    <button
                        key={n}
                        type="button"
                        className={`pager__btn ${n === page ? "is-active" : ""}`}
                        onClick={() => onChange(n)}
                    >
                        {n}
                    </button>
                ))}
                <button
                    type="button"
                    className="pager__btn"
                    disabled={page === totalPages}
                    onClick={() => onChange(page + 1)}
                >
                    &rsaquo;
                </button>
            </div>
        </div>
    );
}