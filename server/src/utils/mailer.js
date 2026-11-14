const nodemailer = require("nodemailer");

const configured = process.env.MAIL_USER && process.env.MAIL_PASS;

const transporter = configured
    ? nodemailer.createTransport({
        host: process.env.MAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.MAIL_PORT || 587),
        secure: false,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    })
    : null;

async function sendMail({ to, subject, html, text }) {
    if (!transporter) {
        console.log("[mail] Chưa cấu hình SMTP. Nội dung thư:");
        console.log(`  To: ${to}\n  Subject: ${subject}\n  ${text}`);
        return;
    }
    await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        html,
        text,
    });
}

module.exports = { sendMail };