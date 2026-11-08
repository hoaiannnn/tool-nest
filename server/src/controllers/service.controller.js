const { tr } = require("zod/v4/locales");
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

const useService = async (req, res) => {
    const serviceId = Number(req.params.id);
    const { inputSummary = "", durationMs = 0 } = req.body || {};

    try {
        const service = await db("services").where({
            id: serviceId,
            is_visible: true,
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy dịch vụ"
            });
        }

        if (!service.status !== "ready") {
            return res.status(400).json({
                success: false,
                message: "Dịch vụ chưa sẵn sàng"
            });
        }

        await db.transaction(async (trx) => {
            await trx("services").where({
                id: serviceId,
            }).increment("usage_count", 1);

            if (req.user) {
                await trx("usage_logs").insert({
                    user_id: req.user.id,
                    service_id: serviceId,
                    input_summary: String(inputSummary).slice(0, 300) || "(không có)",
                    status: "success",
                    duration_ms: Math.max(0, Math.round(Number(durationMs) || 0)),
                });
            }

            res.status(200).json({ success: true, message: "Đã ghi nhận lượt sử dụng" });
        });
    } catch (error) {
        console.error("Lỗi ghi nhận sử dụng công cụ:", error.message);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi nhận lượt sử dụng"
        });
    }
}

const getMyHistory = async (req, res) => {
    try {
        const rows = await db("usage_logs as l")
            .join("services as s", "s.id", "l.service_id")
            .join("categories as c", "c.id", "s.category_id")
            .where("l.user_id", req.user.id)
            .select(
                "l.id",
                "l.input_summary",
                "l.status",
                "l.duration_ms",
                "l.created_at",
                "s.id as service_id",
                "s.name as service_name",
                "c.slug as category_slug"
            )
            .orderBy("l.created_at", "desc")
            .limit(200);

        res.status(200).json({
            success: true,
            data: rows.map((r) => ({
                id: r.id,
                serviceId: r.service_id,
                serviceName: r.service_name,
                category: CATEGORY_KEY[r.category_slug] || r.category_slug,
                inputSummary: r.input_summary,
                status: r.status,
                durationMs: r.duration_ms,
                createdAt: r.created_at,
            })),
        });
    } catch (error) {
        console.error("Lỗi lấy lịch sử:", error.message);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy lịch sử"
        });
    }
}

module.exports = {
    getAllServices,
    getServiceById,
    useService,
    getMyHistory
};
