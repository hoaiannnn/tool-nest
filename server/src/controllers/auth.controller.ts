import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {success, z} from "zod";
import db from "../config/database";
import { COOKIE_NAME, sendTokenCookie } from "../middlewares/auth.middleware";
import { en, is } from "zod/locales";

const removePassword = (user: any) => {
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
}

const registerSchema = z.object({
    email: z.string().trim().email("Email không đúng định dạng"),
    password: z.string().min(8, "Mật kẩu phải có 8 ký tự trở lên"),
    fullName: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    birthYear: z.number().int().min(1920).max(2026).nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const parsed = registerSchema.safeDecode(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: parsed.error.issues[0].message,
            });
            return;
        }
        
        const { email, password, fullName, birthYear, phone, address } = parsed.data;
        const cleanEmail = email.toLowerCase();

        const existingUser = await db("user").where({email: cleanEmail}).first();
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "Email này đã được sử dụng",
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [newUser] = await db("user")
        .insert({
            email: cleanEmail,
            password: passwordHash,
            full_name: fullName,
            birth_year: birthYear ?? null,
            phone: phone || null,
            address: address || null,
            role: "user",
            status: "active",
            credits: 10,
            plan_type: "free",
        }).returning("*");

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
        })
    };
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ email và mật khẩu",
            });
            return;
        }

        const user = await db("users")
        .where({
            email: String(email).toLowerCase().trim()
        }).first();

        if (!user || !user.password_hash) {
            res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
            return;
        }

        if (user.status === "locked") {
            res.status(403).json({
                success: false,
                message: "Tài khoản của bạn đã bị khoá",
            });
            return;
        }

        const isMtath = await bcrypt.compare(String(password), user.password_hash);
        if (!isMtath) {
            res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
            return;
        }

        sendTokenCookie(res, {
            id: user.id,
            email: user.email,
            role: user.role
        });

        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: removePassword,
        })

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi đăng nhập",
        });
    }
};

export const logout = (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/"});
    res.status(200).json({
        success: true,
        message: "Đã đăng xuất thành công",
    });
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await db("users").where({
            id: req.user!.id,
        }).first();

        if (!user) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Lấy thông tin thành công",
            data: removePassword(user),
        });
    } catch(error) {
        console.error("Lỗi getMe", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
        })
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { fullName, birthYear, phone, address } = req.body
        if (!fullName || String(fullName).trim().length < 2) {
            res.status(400).json({
                success: false,
                message: "Họ tên phải từ 2 ký tự trở lên",
            });
            return;
        }

        const [updateUser] = await db("user")
        .where({
            id: req.user!.id,
        }).update({
            full_name: String(fullName).trim(),
            birth_year: birthYear ? Number(birthYear) : null,
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null,
            updated_at: db.fn.now(),
        }).returning("*");

        res.status(200).json({
            success: true,
            message: " Cập nhật thông tin cá nhân thành công",
            data: removePassword(updateUser),
        });
    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi cập nhật hồ sơ cá nhân"
        });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || String(newPassword).length < 8) {
            res.status(400).json({
                success: false,
                message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 8 ký tự)",
            });
            return;
        }

        const user = await db("users").where({
            id: req.user!.id
        }).first();
        if (!user || !user.password_hash) {
            res.status(400).json({
                success: false,
                message: "Tài khoản không hợp lệ",
            });
            return;
        }

        const isCurrentMatch = await bcrypt.compare(String(currentPassword), user.password_hash);
        if (!isCurrentMatch) {
            res.status(400).json({
                success: false,
                message: "Mật khẩu hiện tại không đúng",
            });
            return;
        }

        const newHash = await bcrypt.hash(String(newPassword), 10);
        await db("users").where({
                id: req.user!.id
        }).update({
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
        })
    }
};