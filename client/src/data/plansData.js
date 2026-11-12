export const PLANS_LIST = [
    {
        id: "free",
        name: "Miễn phí",
        badge: "Cơ bản",
        priceMonthly: 0,
        priceYearly: 0,
        creditsBonus: 10,
        desc: "Phù hợp cho nhu cầu xử lý tệp cơ bản hằng ngày của cá nhân.",
        featured: false,
        features: [
            "Tặng 10 Credits khi đăng ký mới",
            "Sử dụng các công cụ PDF, Ảnh, Tệp cơ bản",
            "Xử lý ngay trên trình duyệt, tệp không bị tải lên máy chủ",
        ],
    },
    {
        id: "pro",
        name: "Gói Pro",
        badge: "Phổ biến nhất",
        priceMonthly: 79000,
        priceYearly: 790000,
        creditsBonus: 500,
        desc: "Tối ưu cho sinh viên, nhân viên văn phòng và người sáng tạo nội dung.",
        featured: true,
        features: [
            "Cộng ngay +500 Credits",
            "Mở khóa toàn bộ công cụ, kể cả nhóm AI viết",
            "Ưu tiên xử lý, không quảng cáo",
        ],
    },
    {
        id: "team",
        name: "Gói Nhóm",
        badge: "Doanh nghiệp & Nhóm",
        priceMonthly: 199000,
        priceYearly: 1990000,
        creditsBonus: 2000,
        desc: "Dành cho nhóm làm việc cần xử lý số lượng lớn tài liệu mỗi ngày.",
        featured: false,
        features: [
            "Cộng ngay +2.000 Credits",
            "Tất cả quyền lợi của Gói Pro",
            "Hỗ trợ kỹ thuật ưu tiên",
        ],
    },
];

export const PLAN_MAP = Object.fromEntries(PLANS_LIST.map((p) => [p.id, p]));

export const PLAN_FAQS = [
    {
        q: "Credits là gì?",
        a: "Credits là số lượt dùng các dịch vụ có tính phí trên ToolNest. Hiện nhiều công cụ cơ bản được dùng miễn phí, không trừ Credits.",
    },
    {
        q: "Nâng cấp gói thì Credits có cộng dồn không?",
        a: "Có. Số Credits của gói (+500 hoặc +2.000) được cộng dồn vào số dư hiện có trong tài khoản của bạn.",
    },
    {
        q: "Tôi có thể thanh toán bằng những phương thức nào?",
        a: "Hệ thống hỗ trợ chuyển khoản VietQR, ví MoMo và thẻ thanh toán nội địa hoặc quốc tế.",
    },
];