export const CATEGORIES = [
    { id: "pdf", name: "Công cụ PDF", short: "PDF", sub: "Giải quyết việc với PDF", feature: "Gộp PDF", verb: "tệp PDF", accept: ".pdf" },
    { id: "img", name: "Công cụ ảnh", short: "Ảnh", sub: "Giải quyết việc với ảnh", feature: "Nén ảnh", verb: "ảnh", accept: "image/*" },
    { id: "vid", name: "Công cụ video", short: "Video", sub: "Giải quyết việc với video", feature: "Tắt tiếng", verb: "video", accept: "video/*" },
    { id: "ai", name: "AI viết", short: "AI viết", sub: "Giải quyết việc với văn bản", feature: "Viết đoạn văn", verb: "văn bản", accept: "" },
    { id: "file", name: "Công cụ tệp", short: "Tệp", sub: "Giải quyết việc với tệp", feature: "CSV sang Excel", verb: "tệp", accept: "*/*" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));