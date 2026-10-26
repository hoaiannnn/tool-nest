import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import db from "../config/database";
import { email, success } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "toolnest_secret_ket_2026_ptit";
export const COOKIE_NAME = "toolnest_token";

export interface AuthUser {
    id: number;
    email: string;
    role: "user" | "admin";
}

declare global {
    namespace Express {
        interface Request {
            user ?: AuthUser;
        }
    }
}

export const sendTokenCookie = (res: Response, user: AuthUser) => {
    const token = jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
    },
        JWT_SECRET,
        { expiresIn: "7d"}
    );

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.[COOKIE_NAME];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Vui lòng đăng nhập để tiếp tục",
            })
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

        const userInDb = await db("users")
        .select("id", "email", "role", "status")
        .where({id: decoded.id})
        .first();

        if (!userInDb) {
            res.status(401).json({
                success: false,
                message: "Tài khoản không tồn tại",
            })
            return;
        }

        if (userInDb.status === "locked") {
            res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị khoá",
            })
            return;
        }

        req.user = {id: userInDb.id, email: userInDb.email, role: userInDb.role};
        next();
    } catch (_error) {
        res.status(401).json({
            success: false,
            message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
        })
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) =>{
    if (!req.user || req.user.role !== "admin") {
        res.status(403).json({
            success: false,
            message: "Bạn không có quyền Quản trị viên để thực hiện thao tác này",
        })
        return;
    }
    next()
}