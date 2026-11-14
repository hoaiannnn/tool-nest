const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { sendMail } = require("../utils/mailer");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function forgotPassword(req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
        return res.status(400).json({ message: "Vui lòng nhập email." });
    }

    try {
        const user = await db("users").where({ email }).first();

        if (user && user.status !== "locked") {
            const token = crypto.randomBytes(32).toString("hex");

            await db("password_resets")
                .where({ user_id: user.id })
                .whereNull("used_at")
                .update({ used_at: db.fn.now() });

            await db("password_resets").insert({
                user_id: user.id,
                token_hash: sha256(token),
                expires_at: new Date(Date.now() + 30 * 60 * 1000),
            });

            const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;

            await sendMail({
                to: user.email,
                subject: "ToolNest - Đặt lại mật khẩu",
                text: `Bạn vừa yêu cầu đặt lại mật khẩu. Mở liên kết sau (hết hạn sau 30 phút): ${link}`,
                html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu ToolNest.</p>
               <p><a href="${link}">Bấm vào đây để đặt mật khẩu mới</a> (hết hạn sau 30 phút).</p>
               <p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>`,
            });
        }

        return res.json({
            message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
        });
    } catch (err) {
        console.error("forgotPassword:", err);
        return res.status(500).json({ message: "Không thể xử lý yêu cầu lúc này." });
    }
}

async function resetPassword(req, res) {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");

    if (!token) {
        return res.status(400).json({ message: "Liên kết không hợp lệ." });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự." });
    }

    try {
        const row = await db("password_resets")
            .where({ token_hash: sha256(token) })
            .whereNull("used_at")
            .where("expires_at", ">", new Date())
            .first();

        if (!row) {
            return res
                .status(400)
                .json({ message: "Liên kết đã hết hạn hoặc đã được sử dụng." });
        }

        const hash = await bcrypt.hash(password, 10);

        await db.transaction(async (trx) => {
            await trx("users").where({ id: row.user_id }).update({ password_hash: hash });
            await trx("password_resets")
                .where({ id: row.id })
                .update({ used_at: trx.fn.now() });
        });

        return res.json({ message: "Đặt lại mật khẩu thành công. Hãy đăng nhập." });
    } catch (err) {
        console.error("resetPassword:", err);
        return res.status(500).json({ message: "Không thể xử lý yêu cầu lúc này." });
    }
}

module.exports = { forgotPassword, resetPassword };