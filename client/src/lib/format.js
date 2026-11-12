export function formatDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
}

export function formatVnd(amount) {
    return `${Number(amount || 0).toLocaleString("vi-VN")}đ`;
}

export function normalize(text) {
    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .toLowerCase();
}