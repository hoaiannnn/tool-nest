import { Request, Response } from "express";
import db from "../config/database";

export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await db("categories")
        .select("id", "slug", "name", "icon", "sort_order")
        .orderBy("sort_order", "asc");

        res.status(200).json({
            success: true,
            message: "Lấy danh sách danh mục thành công",
            data: categories,
        });
    } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy danh mục",
        })
    }
};