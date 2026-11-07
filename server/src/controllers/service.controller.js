const db = require("../config/database");

const CATEGORY_KEY = {
    pdf: "pdf",
    image: "img",
    video: "vid",
    "ai-writer": "ai",
    "file-tools": "file",
};

const baseQuery = () =>
    db("services as s")
        .join("categories as c", "c.id", "s.category_id")
        .select(
            "s.id",
            "s.slug",
            "s.name",
            "s.short_desc",
            "s.status",
            "s.credit_cost",
            "s.usage_count",
            "s.created_at",
            "c.slug as category_slug"
        )
        .where("s.is_visible", true);


const formatService = (row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: CATEGORY_KEY[row.category_slug] || row.category_slug,
    desc: row.short_desc,
    status: row.status,
    credit: row.credit_cost,
    uses: row.usage_count,
    created: new Date(row.created_at).toISOString().slice(0, 10),
});

const getAllServices = async (_req, res) => {
    try {
        const rows = await baseQuery().orderBy("s.id", "asc");
        res.status(200).json({
            success: true,
            message: "Lấy danh sách dịch vụ thành công",
            data: rows.map(formatService),
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách dịch vụ");
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy danh sách dịch vụ"
        });
    }
};

const getServiceById = async (req, res) => {
    try {
        const row = await baseQuery().andWhere("s.id", Number(req.params.id)).first();
        if (!row) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ"
            });
        }
        res.status(200).json({
            success: true,
            data: formatService(row)
        })
    } catch (error) {
        console.error("Lỗi lấy chi tiết dịch vụ", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy chi tiết dịch vụ"
        })
    }
};

module.exports = {
    getAllServices,
    getServiceById,
};
