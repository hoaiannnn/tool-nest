require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/database");
const categoryRoutes = require("./routes/category.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: ["http://localhost:5174", "http://localhost:5173"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
    try {
        await db.raw("SELECT 1");
        res.json({ success: true, message: "Server & SQL Server đang hoạt động tốt!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi kết nối SQL Server" });
    }
});

app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(` Backend đang chạy tại http://localhost:${PORT}`);
});