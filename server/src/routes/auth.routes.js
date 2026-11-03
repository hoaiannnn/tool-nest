const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = Router();

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Bạn thử quá nhiều lần, vui lòng đợi 5 phút sau.",
    },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.put("/change-password", requireAuth, changePassword);

module.exports = router;