const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "toolnest_super_secret_key_2026";
const COOKIE_NAME = "toolnest_token";

const sendTokenCookie = (res, payload) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};

const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies?.[COOKIE_NAME];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Vui lòng đăng nhập để tiếp tục",
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Chỉ Quản trị viên mới có quyền thực hiện thao tác này",
        });
    }
    next();
};

module.exports = {
    COOKIE_NAME,
    sendTokenCookie,
    requireAuth,
    requireAdmin,
};