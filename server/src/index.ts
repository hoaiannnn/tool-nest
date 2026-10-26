import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";

import db from "./config/database";
import { getCategories } from "./controllers/category.controller";

import authRotes from "./routes/auth.routes";

dotenv.config({ path: path.resolve(__dirname, "../.env")});

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "Backend ToolNest đang chạy!" });
});

app.get("/api/categories", getCategories);

app.use("/api", authRotes);

app.listen(PORT, async () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    try {
        await db.raw("SELECT 1");
        console.log("Đã kết nối tới SQL Server thành công!");
    } catch (error) {
        console.error("Lỗi kết nối tới SQL Server:", error);
    }
})
