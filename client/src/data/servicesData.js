export const CATEGORIES = [
    { id: "pdf", name: "Công cụ PDF", short: "PDF", sub: "Giải quyết việc với PDF", feature: "Gộp PDF", verb: "tệp PDF", accept: ".pdf" },
    { id: "img", name: "Công cụ ảnh", short: "Ảnh", sub: "Giải quyết việc với ảnh", feature: "Nén ảnh", verb: "ảnh", accept: "image/*" },
    { id: "vid", name: "Công cụ video", short: "Video", sub: "Giải quyết việc với video", feature: "Tắt tiếng", verb: "video", accept: "video/*" },
    { id: "ai", name: "AI viết", short: "AI viết", sub: "Giải quyết việc với văn bản", feature: "Viết đoạn văn", verb: "văn bản", accept: "" },
    { id: "file", name: "Công cụ tệp", short: "Tệp", sub: "Giải quyết việc với tệp", feature: "CSV sang Excel", verb: "tệp", accept: "*/*" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const SERVICES_LIST = [
    { id: 1, name: "Gộp PDF", category: "pdf", desc: "Ghép nhiều tệp PDF thành một tệp.", status: "ready", uses: 4820, created: "2026-01-12" },
    { id: 2, name: "Tách PDF", category: "pdf", desc: "Chọn trang cần tách ra khỏi tệp PDF.", status: "ready", uses: 2310, created: "2026-01-12" },
    { id: 3, name: "PDF sang JPG", category: "pdf", desc: "Chuyển từng trang PDF thành ảnh JPG.", status: "soon", uses: 0, created: "2026-02-03" },
    { id: 4, name: "Nén PDF", category: "pdf", desc: "Giảm dung lượng tệp PDF để gửi email dễ hơn.", status: "ready", uses: 1760, created: "2026-02-03" },
    { id: 5, name: "Nén ảnh", category: "img", desc: "Giảm dung lượng ảnh, giữ chất lượng.", status: "ready", uses: 5240, created: "2026-01-20" },
    { id: 6, name: "Đổi định dạng ảnh", category: "img", desc: "Chuyển qua lại giữa PNG, JPG và WebP.", status: "ready", uses: 3120, created: "2026-01-20" },
    { id: 7, name: "Đổi kích thước ảnh", category: "img", desc: "Thu nhỏ hoặc phóng to ảnh theo pixel.", status: "soon", uses: 0, created: "2026-03-08" },
    { id: 8, name: "Tắt tiếng video", category: "vid", desc: "Xoá âm thanh khỏi video.", status: "soon", uses: 0, created: "2026-03-15" },
    { id: 9, name: "Cắt video", category: "vid", desc: "Chọn đoạn đầu và cuối cần giữ lại.", status: "soon", uses: 0, created: "2026-03-15" },
    { id: 10, name: "Viết đoạn văn", category: "ai", desc: "Nhập ý chính, nhận đoạn văn hoàn chỉnh.", status: "ready", uses: 3980, created: "2026-02-10" },
    { id: 11, name: "Tóm tắt văn bản", category: "ai", desc: "Rút gọn bài dài thành vài câu chính.", status: "ready", uses: 2870, created: "2026-02-10" },
    { id: 12, name: "CSV sang Excel", category: "file", desc: "Đổi tệp CSV thành bảng tính XLSX.", status: "ready", uses: 1490, created: "2026-02-25" },
    { id: 13, name: "Định dạng JSON", category: "file", desc: "Làm đẹp và kiểm tra lỗi chuỗi JSON.", status: "ready", uses: 980, created: "2026-02-25" },
];