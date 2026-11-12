const db = require("../config/database");

const PLANS = {
    pro: { name: "Gói Pro", monthlyPrice: 79000, yearlyPrice: 790000, monthlyCredits: 500 },
    team: { name: "Gói Nhóm", monthlyPrice: 199000, yearlyPrice: 1990000, monthlyCredits: 2000 },
};
const METHODS = ["momo", "vietqr", "card"];

const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const checkoutPlan = async (req, res) => {
    const { planId, cycle = "monthly", method = "momo" } = req.body || {};

    const plan = PLANS[planId];
    if (!plan) {
        return res.status(400).json({ success: false, message: "Gói dịch vụ không hợp lệ" });
    }
    if (!["monthly", "yearly"].includes(cycle)) {
        return res.status(400).json({ success: false, message: "Chu kỳ thanh toán không hợp lệ" });
    }
    if (!METHODS.includes(method)) {
        return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ" });
    }

    const isYearly = cycle === "yearly";
    const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const addedCredits = isYearly ? plan.monthlyCredits * 12 : plan.monthlyCredits;
    const orderCode = `TN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    const paidAt = new Date();

    try {
        const updatedUser = await db.transaction(async (trx) => {
            const user = await trx("users").where({ id: req.user.id }).first();
            if (!user) {
                const err = new Error("Không tìm thấy tài khoản");
                err.status = 404;
                throw err;
            }

            const stillActive =
                user.plan_type === planId &&
                user.plan_expires_at &&
                new Date(user.plan_expires_at) > paidAt;
            const expiresAt = addMonths(stillActive ? user.plan_expires_at : paidAt, isYearly ? 12 : 1);

            await trx("payment_transactions").insert({
                order_code: orderCode,
                user_id: user.id,
                package_code: `${planId}_${cycle}`,
                amount_vnd: amount,
                credits_granted: addedCredits,
                provider: method,
                provider_trans_id: `DEMO-${orderCode}`,
                status: "paid",
                paid_at: paidAt,
            });

            await trx("users")
                .where({ id: user.id })
                .update({
                    plan_type: planId,
                    plan_expires_at: expiresAt,
                    credits: trx.raw("credits + ?", [addedCredits]),
                    updated_at: db.fn.now(),
                });

            return trx("users").where({ id: user.id }).first();
        });

        const { password_hash, ...safeUser } = updatedUser;

        return res.status(200).json({
            success: true,
            message: `Nâng cấp ${plan.name} thành công`,
            data: {
                user: safeUser,
                receipt: {
                    transactionCode: orderCode,
                    planName: plan.name,
                    cycle: isYearly ? "12 tháng" : "1 tháng",
                    method,
                    amount,
                    addedCredits,
                    totalCredits: safeUser.credits,
                    expiresAt: safeUser.plan_expires_at,
                    paidAt: paidAt.toISOString(),
                },
            },
        });
    } catch (error) {
        console.error("Lỗi thanh toán nâng cấp gói:", error.message);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Lỗi máy chủ khi xử lý thanh toán",
        });
    }
};

module.exports = { checkoutPlan };