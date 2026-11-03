const db = require("../config/database");

const getAllCategories = async (_req, res) => {
    try {
        const categories = await db("categories").select("*").orderBy("sort_order", "asc");
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
        });
    }
};

module.exports = { getAllCategories };