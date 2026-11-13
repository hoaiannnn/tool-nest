const bcrypt = require("bcryptjs");
const db = require("../config/database");

const PLAN_TYPES = ["free", "pro", "team"];

const CATEGORY_SLUG = {
    pdf: "pdf",
    img: "image",
    vid: "video",
    ai: "ai-writer",
    file: "file-tools",
};
const SLUG_TO_KEY = Object.fromEntries(Object.entries(CATEGORY_SLUG).map(([k, v]) => [v, k]));
const SERVICE_STATUS = ["ready", "soon"];

const slugify = (text) =>
    String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "dich-vu";

async function uniqueSlug(base) {
    let slug = base;
    let i = 2;
    while (await db("services").where({ slug }).first()) {
        slug = `${base}-${i++}`;
    }
    return slug;
}

const formatService = (row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: SLUG_TO_KEY[row.category_slug] || "pdf",
    desc: row.short_desc,
    status: row.status,
    visible: Boolean(row.is_visible),
    creditCost: row.credit_cost,
    uses: row.usage_count,
    createdAt: row.created_at,
});

const serviceQuery = () =>
    db("services as s")
        .join("categories as c", "c.id", "s.category_id")
        .select(
            "s.id",
            "s.slug",
            "s.name",
            "s.short_desc",
            "s.status",
            "s.is_visible",
            "s.credit_cost",
            "s.usage_count",
            "s.created_at",
            "c.slug as category_slug"
        );

const fail = (res, error, message, code = 500) => {
    console.error(message, "-", error.message);
    return res.status(code).json({ success: false, message });
};

const getOverview = async (_req, res) => {
    try {
        const [
            [{ total: totalUsers }],
            [{ total: totalAdmins }],
            [{ total: paidUsers }],
            [{ total: totalServices }],
            [{ total: totalUses }],
            [{ total: totalRevenue }],
            topServices,
            recentLogs,
        ] = await Promise.all([
            db("users").where({ role: "user" }).count({ total: "*" }),
            db("users").where({ role: "admin" }).count({ total: "*" }),
            db("users").where({ role: "user" }).whereIn("plan_type", ["pro", "team"]).count({ total: "*" }),
            db("services").count({ total: "*" }),
            db("services").sum({ total: "usage_count" }),
            db("payment_transactions").where({ status: "paid" }).sum({ total: "amount_vnd" }),
            serviceQuery().orderBy("s.usage_count", "desc").limit(5),
            db("usage_logs as l")
                .join("services as s", "s.id", "l.service_id")
                .leftJoin("users as u", "u.id", "l.user_id")
                .select(
                    "l.id",
                    "l.input_summary",
                    "l.status",
                    "l.created_at",
                    "s.name as service_name",
                    "u.full_name as user_name",
                    "u.email as user_email"
                )
                .orderBy("l.created_at", "desc")
                .limit(6),
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers: Number(totalUsers),
                    totalAdmins: Number(totalAdmins),
                    paidUsers: Number(paidUsers),
                    totalServices: Number(totalServices),
                    totalUses: Number(totalUses || 0),
                    totalRevenue: Number(totalRevenue || 0),
                },
                topServices: topServices.map(formatService),
                recentLogs: recentLogs.map((r) => ({
                    id: r.id,
                    serviceName: r.service_name,
                    userName: r.user_name,
                    userEmail: r.user_email,
                    inputSummary: r.input_summary,
                    status: r.status,
                    createdAt: r.created_at,
                })),
            },
        });
    } catch (error) {
        fail(res, error, "Lỗi máy chủ khi tải thống kê");
    }
};

const getUsers = async (_req, res) => {
    try {
        const rows = await db("users")
            .where({ role: "user" })
            .select("id", "email", "full_name", "phone", "plan_type", "credits", "status", "created_at")
            .orderBy("id", "desc");

        res.status(200).json({
            success: true,
            data: rows.map((u) => ({
                id: u.id,
                email: u.email,
                fullName: u.full_name,
                phone: u.phone,
                planType: u.plan_type,
                credits: u.credits,
                status: u.status,
                createdAt: u.created_at,
            })),
        });
    } catch (error) {
        fail(res, error, "Lỗi lấy danh sách người dùng");
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const target = await db("users").where({ id: userId }).first();

        if (!target) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        if (target.role !== "user") {
            return res.status(403).json({ success: false, message: "Không thể khoá tài khoản quản trị viên" });
        }

        const nextStatus = target.status === "locked" ? "active" : "locked";
        await db("users").where({ id: userId }).update({ status: nextStatus, updated_at: db.fn.now() });

        res.status(200).json({
            success: true,
            message: nextStatus === "locked" ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản",
            data: { id: userId, status: nextStatus },
        });
    } catch (error) {
        fail(res, error, "Lỗi cập nhật trạng thái người dùng");
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const target = await db("users").where({ id: userId }).first();

        if (!target) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }
        if (target.role !== "user") {
            return res.status(403).json({ success: false, message: "Chỉ sửa được tài khoản người dùng thường" });
        }

        const { fullName, phone, planType, credits } = req.body || {};
        const data = {};

        if (fullName !== undefined) {
            if (String(fullName).trim().length < 2) {
                return res.status(400).json({ success: false, message: "Họ tên phải từ 2 ký tự trở lên" });
            }
            data.full_name = String(fullName).trim();
        }
        if (phone !== undefined) {
            data.phone = String(phone).trim() || null;
        }
        if (planType !== undefined) {
            if (!PLAN_TYPES.includes(planType)) {
                return res.status(400).json({ success: false, message: "Gói dịch vụ không hợp lệ" });
            }
            data.plan_type = planType;
            if (planType === "free") data.plan_expires_at = null;
        }
        if (credits !== undefined) {
            const value = Number(credits);
            if (!Number.isInteger(value) || value < 0) {
                return res.status(400).json({ success: false, message: "Credits phải là số nguyên không âm" });
            }
            data.credits = value;
        }

        if (!Object.keys(data).length) {
            return res.status(400).json({ success: false, message: "Không có thông tin nào để cập nhật" });
        }
        data.updated_at = db.fn.now();

        await db("users").where({ id: userId }).update(data);
        res.status(200).json({ success: true, message: "Đã cập nhật thông tin người dùng" });
    } catch (error) {
        fail(res, error, "Lỗi cập nhật thông tin người dùng");
    }
};

const changeUserRole = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { role } = req.body || {};

        if (!["admin", "user"].includes(role)) {
            return res.status(400).json({ success: false, message: "Quyền không hợp lệ" });
        }
        if (userId === req.user.id) {
            return res.status(403).json({ success: false, message: "Không thể tự đổi quyền của chính mình" });
        }

        const target = await db("users").where({ id: userId }).first();
        if (!target) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
        }
        if (target.role === role) {
            return res.status(400).json({ success: false, message: "Tài khoản đã ở quyền này" });
        }
        if (role === "admin" && target.status === "locked") {
            return res.status(400).json({ success: false, message: "Hãy mở khoá tài khoản trước khi cấp quyền admin" });
        }
        if (role === "user") {
            const [{ total }] = await db("users").where({ role: "admin" }).count({ total: "*" });
            if (Number(total) <= 1) {
                return res.status(409).json({ success: false, message: "Hệ thống phải còn ít nhất một quản trị viên" });
            }
        }

        await db("users").where({ id: userId }).update({ role, updated_at: db.fn.now() });
        res.status(200).json({
            success: true,
            message: role === "admin" ? "Đã cấp quyền quản trị viên" : "Đã hạ xuống người dùng thường",
        });
    } catch (error) {
        fail(res, error, "Lỗi đổi quyền tài khoản");
    }
};

const getActivity = async (_req, res) => {
    try {
        const rows = await db("usage_logs as l")
            .join("services as s", "s.id", "l.service_id")
            .leftJoin("users as u", "u.id", "l.user_id")
            .select(
                "l.id",
                "l.input_summary",
                "l.status",
                "l.duration_ms",
                "l.created_at",
                "s.name as service_name",
                "u.full_name as user_name",
                "u.email as user_email"
            )
            .orderBy("l.created_at", "desc")
            .limit(500);

        res.status(200).json({
            success: true,
            data: rows.map((r) => ({
                id: r.id,
                serviceName: r.service_name,
                userName: r.user_name,
                userEmail: r.user_email,
                inputSummary: r.input_summary,
                status: r.status,
                durationMs: r.duration_ms,
                createdAt: r.created_at,
            })),
        });
    } catch (error) {
        fail(res, error, "Lỗi lấy nhật ký hoạt động");
    }
};

const getAdminServices = async (_req, res) => {
    try {
        const rows = await serviceQuery().orderBy("s.id", "asc");
        res.status(200).json({ success: true, data: rows.map(formatService) });
    } catch (error) {
        fail(res, error, "Lỗi lấy danh sách dịch vụ");
    }
};

const createService = async (req, res) => {
    try {
        const { name, category = "pdf", desc = "", status = "ready", visible = true, creditCost = 0 } =
            req.body || {};

        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: "Tên dịch vụ không được để trống" });
        }
        if (!CATEGORY_SLUG[category]) {
            return res.status(400).json({ success: false, message: "Danh mục không hợp lệ" });
        }
        if (!SERVICE_STATUS.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }
        const cost = Number(creditCost);
        if (!Number.isInteger(cost) || cost < 0) {
            return res.status(400).json({ success: false, message: "Chi phí Credits phải là số nguyên không âm" });
        }

        const cat = await db("categories").where({ slug: CATEGORY_SLUG[category] }).first();
        if (!cat) {
            return res.status(400).json({ success: false, message: "Danh mục chưa có trong cơ sở dữ liệu" });
        }

        const slug = await uniqueSlug(slugify(name));
        await db("services").insert({
            category_id: cat.id,
            slug,
            name: String(name).trim(),
            short_desc: String(desc).trim() || String(name).trim(),
            status,
            is_visible: Boolean(visible),
            credit_cost: cost,
            usage_count: 0,
        });

        res.status(201).json({ success: true, message: "Đã thêm dịch vụ mới" });
    } catch (error) {
        fail(res, error, "Lỗi máy chủ khi thêm dịch vụ");
    }
};

const updateService = async (req, res) => {
    try {
        const serviceId = Number(req.params.id);
        const { name, category, desc, status, visible, creditCost } = req.body || {};

        const existing = await db("services").where({ id: serviceId }).first();
        if (!existing) {
            return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
        }

        const data = {};
        if (name !== undefined) {
            if (!String(name).trim()) {
                return res.status(400).json({ success: false, message: "Tên dịch vụ không được để trống" });
            }
            data.name = String(name).trim();
        }
        if (desc !== undefined) data.short_desc = String(desc).trim() || existing.short_desc;
        if (status !== undefined) {
            if (!SERVICE_STATUS.includes(status)) {
                return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
            }
            data.status = status;
        }
        if (visible !== undefined) data.is_visible = Boolean(visible);
        if (creditCost !== undefined) {
            const cost = Number(creditCost);
            if (!Number.isInteger(cost) || cost < 0) {
                return res.status(400).json({ success: false, message: "Chi phí Credits phải là số nguyên không âm" });
            }
            data.credit_cost = cost;
        }
        if (category !== undefined) {
            if (!CATEGORY_SLUG[category]) {
                return res.status(400).json({ success: false, message: "Danh mục không hợp lệ" });
            }
            const cat = await db("categories").where({ slug: CATEGORY_SLUG[category] }).first();
            if (!cat) {
                return res.status(400).json({ success: false, message: "Danh mục chưa có trong cơ sở dữ liệu" });
            }
            data.category_id = cat.id;
        }

        if (!Object.keys(data).length) {
            return res.status(400).json({ success: false, message: "Không có thông tin nào để cập nhật" });
        }
        data.updated_at = db.fn.now();

        await db("services").where({ id: serviceId }).update(data);
        res.status(200).json({ success: true, message: "Cập nhật dịch vụ thành công" });
    } catch (error) {
        fail(res, error, "Lỗi cập nhật dịch vụ");
    }
};

const deleteService = async (req, res) => {
    try {
        const serviceId = Number(req.params.id);

        const existing = await db("services").where({ id: serviceId }).first();
        if (!existing) {
            return res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" });
        }

        const used = await db("usage_logs").where({ service_id: serviceId }).first();
        if (used) {
            return res.status(409).json({
                success: false,
                message: "Dịch vụ đã có lịch sử sử dụng, hãy ẩn dịch vụ thay vì xoá",
            });
        }

        await db("services").where({ id: serviceId }).del();
        res.status(200).json({ success: true, message: "Đã xoá dịch vụ" });
    } catch (error) {
        fail(res, error, "Lỗi xoá dịch vụ");
    }
};

const getAdmins = async (_req, res) => {
    try {
        const rows = await db("users")
            .where({ role: "admin" })
            .select("id", "email", "full_name", "phone", "status", "created_at")
            .orderBy("id", "asc");

        res.status(200).json({
            success: true,
            data: rows.map((u) => ({
                id: u.id,
                email: u.email,
                fullName: u.full_name,
                phone: u.phone,
                status: u.status,
                createdAt: u.created_at,
            })),
        });
    } catch (error) {
        fail(res, error, "Lỗi lấy danh sách quản trị viên");
    }
};

const createAdmin = async (req, res) => {
    try {
        const { fullName, email, password, phone = "" } = req.body || {};
        const cleanEmail = String(email || "").trim().toLowerCase();

        if (!fullName || String(fullName).trim().length < 2) {
            return res.status(400).json({ success: false, message: "Họ tên phải từ 2 ký tự trở lên" });
        }
        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            return res.status(400).json({ success: false, message: "Email không hợp lệ" });
        }
        if (!password || String(password).length < 8) {
            return res.status(400).json({ success: false, message: "Mật khẩu tối thiểu 8 ký tự" });
        }

        const exists = await db("users").where({ email: cleanEmail }).first();
        if (exists) {
            return res.status(409).json({ success: false, message: "Email này đã tồn tại trong hệ thống" });
        }

        await db("users").insert({
            full_name: String(fullName).trim(),
            email: cleanEmail,
            password_hash: await bcrypt.hash(String(password), 10),
            phone: String(phone).trim() || null,
            role: "admin",
            status: "active",
        });

        res.status(201).json({ success: true, message: "Đã tạo tài khoản quản trị viên mới" });
    } catch (error) {
        fail(res, error, "Lỗi tạo tài khoản quản trị viên");
    }
};

module.exports = {
    getOverview,
    getUsers,
    toggleUserStatus,
    getActivity,
    getAdminServices,
    createService,
    updateService,
    deleteService,
    getAdmins,
    createAdmin,
    updateUser,
    changeUserRole
};