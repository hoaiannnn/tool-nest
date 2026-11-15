const db = require("../config/database");
const { PLANS } = require("./plan.controller");

const PAYPAL_BASE = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
const USD_VND_RATE = Number(process.env.USD_VND_RATE || 25000);

const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

const toUsd = (vnd) => (Number(vnd) / USD_VND_RATE).toFixed(2);

const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

async function getAccessToken() {
    const id = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!id || !secret) throw httpError(500, "Chưa cấu hình PayPal trên máy chủ");

    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error("PayPal token lỗi:", data);
        throw httpError(502, "Không kết nối được PayPal (kiểm tra Client ID / Secret)");
    }
    return data.access_token;
}

async function paypalRequest(path, { method = "GET", body } = {}) {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

const createPaypalOrder = async (req, res) => {
    const { planId, cycle = "monthly" } = req.body || {};

    const plan = PLANS[planId];
    if (!plan) {
        return res.status(400).json({ success: false, message: "Gói dịch vụ không hợp lệ" });
    }
    if (!["monthly", "yearly"].includes(cycle)) {
        return res.status(400).json({ success: false, message: "Chu kỳ thanh toán không hợp lệ" });
    }

    const isYearly = cycle === "yearly";
    const amountVnd = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const credits = isYearly ? plan.monthlyCredits * 12 : plan.monthlyCredits;
    const orderCode = `TN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    try {
        const r = await paypalRequest("/v2/checkout/orders", {
            method: "POST",
            body: {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        reference_id: orderCode,
                        description: `ToolNest ${plan.name} (${isYearly ? "12 tháng" : "1 tháng"})`,
                        amount: { currency_code: "USD", value: toUsd(amountVnd) },
                    },
                ],
                application_context: {
                    brand_name: "ToolNest",
                    user_action: "PAY_NOW",
                    return_url: `${clientUrl}/payment/paypal-return`,
                    cancel_url: `${clientUrl}/checkout?plan=${planId}&cycle=${cycle}&cancelled=1`,
                },
            },
        });

        if (!r.ok) {
            console.error("PayPal tạo đơn lỗi:", JSON.stringify(r.data));
            throw httpError(502, "PayPal từ chối tạo đơn hàng");
        }

        const approve = (r.data.links || []).find(
            (l) => l.rel === "approve" || l.rel === "payer-action"
        );
        if (!approve) throw httpError(502, "PayPal không trả về liên kết thanh toán");

        await db("payment_transactions").insert({
            order_code: orderCode,
            user_id: req.user.id,
            package_code: `${planId}_${cycle}`,
            amount_vnd: amountVnd,
            credits_granted: credits,
            provider: "paypal",
            provider_trans_id: r.data.id,
            status: "pending",
        });

        return res.json({ success: true, data: { approveUrl: approve.href } });
    } catch (error) {
        console.error("createPaypalOrder:", error.message);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Lỗi máy chủ khi tạo đơn thanh toán",
        });
    }
};

async function buildResult(txId) {
    const tx = await db("payment_transactions").where({ id: txId }).first();
    const user = await db("users").where({ id: tx.user_id }).first();
    const [planId, cycle] = tx.package_code.split("_");
    const { password_hash, ...safeUser } = user;

    return {
        success: true,
        message: "Thanh toán thành công",
        data: {
            user: safeUser,
            receipt: {
                transactionCode: tx.order_code,
                planName: PLANS[planId]?.name || planId,
                cycle: cycle === "yearly" ? "12 tháng" : "1 tháng",
                method: "paypal",
                amount: Number(tx.amount_vnd),
                amountUsd: toUsd(tx.amount_vnd),
                addedCredits: tx.credits_granted,
                totalCredits: safeUser.credits,
                expiresAt: safeUser.plan_expires_at,
                paidAt: tx.paid_at ? new Date(tx.paid_at).toISOString() : null,
            },
        },
    };
}

const capturePaypalOrder = async (req, res) => {
    const orderId = String(req.body?.orderId || "");
    if (!orderId) {
        return res.status(400).json({ success: false, message: "Thiếu mã đơn PayPal" });
    }

    try {
        const tx = await db("payment_transactions")
            .where({ provider: "paypal", provider_trans_id: orderId, user_id: req.user.id })
            .first();
        if (!tx) throw httpError(404, "Không tìm thấy đơn hàng");
        if (tx.status === "paid") return res.json(await buildResult(tx.id));
        if (tx.status !== "pending") throw httpError(400, "Đơn hàng không còn hiệu lực");

        let r = await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
            method: "POST",
            body: {},
        });

        if (!r.ok) {
            const issue = r.data?.details?.[0]?.issue;
            if (issue === "ORDER_ALREADY_CAPTURED") {
                r = await paypalRequest(`/v2/checkout/orders/${orderId}`);
            } else {
                console.error("PayPal capture lỗi:", JSON.stringify(r.data));
                throw httpError(400, "PayPal chưa thu được tiền cho đơn này. Hãy thử thanh toán lại.");
            }
        }

        const capture = r.data?.purchase_units?.[0]?.payments?.captures?.[0];
        const paidOk =
            r.data?.status === "COMPLETED" &&
            capture?.status === "COMPLETED" &&
            capture?.amount?.currency_code === "USD" &&
            Number(capture?.amount?.value) === Number(toUsd(tx.amount_vnd));

        if (!paidOk) {
            console.error("Số tiền/trạng thái PayPal không khớp:", JSON.stringify(r.data));
            throw httpError(400, "Giao dịch chưa hợp lệ, hệ thống chưa cộng gói.");
        }

        const [planId, cycle] = tx.package_code.split("_");
        const now = new Date();

        await db.transaction(async (trx) => {
            const claimed = await trx("payment_transactions")
                .where({ id: tx.id, status: "pending" })
                .update({ status: "paid", paid_at: now });
            if (!claimed) return;

            const user = await trx("users").where({ id: tx.user_id }).first();
            const stillActive =
                user.plan_type === planId &&
                user.plan_expires_at &&
                new Date(user.plan_expires_at) > now;
            const expiresAt = addMonths(
                stillActive ? user.plan_expires_at : now,
                cycle === "yearly" ? 12 : 1
            );

            await trx("users")
                .where({ id: user.id })
                .update({
                    plan_type: planId,
                    plan_expires_at: expiresAt,
                    credits: trx.raw("credits + ?", [tx.credits_granted]),
                    updated_at: db.fn.now(),
                });
        });

        return res.json(await buildResult(tx.id));
    } catch (error) {
        console.error("capturePaypalOrder:", error.message);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Lỗi máy chủ khi xác nhận thanh toán",
        });
    }
};

module.exports = { createPaypalOrder, capturePaypalOrder };