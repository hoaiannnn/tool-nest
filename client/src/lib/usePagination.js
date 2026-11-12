import { useEffect, useState } from "react";

export function usePagination(list, pageSize, resetKey = "") {
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [resetKey]);

    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const current = Math.min(page, totalPages);
    const items = list.slice((current - 1) * pageSize, current * pageSize);

    return { items, page: current, setPage, total: list.length };
}