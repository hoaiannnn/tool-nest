import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Bạn thử quá nhiều lần, vui lòng đợi 5 phút sau.", 
    },
});

router.post("/auth/register", authLimiter, register);
router.post("/auth/login", authLimiter, login);
router.post("/auth/logout", logout);
router.get("/auth/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.put("/profile/password", requireAuth, changePassword);

export default router;