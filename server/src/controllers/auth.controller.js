const bcrypt = require("bcryptjs");
const { z } = require("zod");
const db = require("../config/database");
const { COOKIE_NAME, sendTokenCookie } = require("../middlewares/auth.middleware");

const removePassword = (user) => {
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
};

const registerSchema = z.object({
    email: z.string().trim().email("Email không đúng định dạng"),
    password: z.string().min(8, "Mật khẩu phải có 8 ký tự trở lên"),
    fullName: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    birthYear: z.number().int().min(1920).max(2026).nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
});

const register = async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.issues[0].message,
            });
        }

        const { email, password, fullName, birthYear, phone, address } = parsed.data;
        const cleanEmail = email.toLowerCase();

        const existingUser = await db("users").where({ email: cleanEmail }).first();
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email này đã được sử dụng",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [newUser] = await db("users")
            .insert({
                email: cleanEmail,
                password_hash: passwordHash,
                full_name: fullName,
                birth_year: birthYear ?? null,
                phone: phone || null,
                address: address || null,
                role: "user",
                status: "active",
                credits: 10,
                plan_type: "free",
            })
            .returning("*");

        sendTokenCookie(res, { id: newUser.id, email: newUser.email, role: newUser.role });

        res.status(201).json({
            success: true,
            message: "Đăng ký tài khoản thành công",
            data: removePassword(newUser),
        });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng ký",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ email và mật khẩu",
            });
        }

        const user = await db("users")
            .where({ email: String(email).toLowerCase().trim() })
            .first();

        if (!user || !user.password_hash) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
        }

        if (user.status === "locked") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị khoá",
            });
        }

        const isMatch = await bcrypt.compare(String(password), user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
        }

        sendTokenCookie(res, {
            id: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: removePassword(user),
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng nhập",
        });
    }
};

const logout = (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.status(200).json({
        success: true,
        message: "Đã đăng xuất thành công",
    });
};

const getMe = async (req, res) => {
    try {
        const user = await db("users").where({ id: req.user.id }).first();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        if (user.status === "locked") {
            res.clearCookie(COOKIE_NAME, { path: "/" });
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị khoá",
            });
        }

        res.status(200).json({
            success: true,
            message: "Lấy thông tin thành công",
            data: removePassword(user),
        });
    } catch (error) {
        console.error("Lỗi getMe:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, birthYear, phone, address } = req.body;
        if (!fullName || String(fullName).trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Họ tên phải từ 2 ký tự trở lên",
            });
        }

        const [updatedUser] = await db("users")
            .where({ id: req.user.id })
            .update({
                full_name: String(fullName).trim(),
                birth_year: birthYear ? Number(birthYear) : null,
                phone: phone ? String(phone).trim() : null,
                address: address ? String(address).trim() : null,
                updated_at: db.fn.now(),
            })
            .returning("*");

        res.status(200).json({
            success: true,
            message: "Cập nhật thông tin cá nhân thành công",
            data: removePassword(updatedUser),
        });
    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi cập nhật hồ sơ cá nhân",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || String(newPassword).length < 8) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 8 ký tự)",
            });
        }

        const user = await db("users").where({ id: req.user.id }).first();
        if (!user || !user.password_hash) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản không hợp lệ",
            });
        }

        const isCurrentMatch = await bcrypt.compare(String(currentPassword), user.password_hash);
        if (!isCurrentMatch) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu hiện tại không đúng",
            });
        }

        const newHash = await bcrypt.hash(String(newPassword), 10);
        await db("users").where({ id: req.user.id }).update({
            password_hash: newHash,
            updated_at: db.fn.now(),
        });

        res.status(200).json({
            success: true,
            message: "Đổi mật khẩu thành công",
        });
    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đổi mật khẩu",
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
};