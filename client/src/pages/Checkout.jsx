import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PLANS_LIST, PLAN_MAP } from "../data/plansData";
import { fetchApi } from "../lib/api";

function formatVnd(amount) {
    return `${Number(amount || 0).toLocaleString("vi-VN")}đ`;
}

const USD_VND_RATE = 25000;

export default function Checkout({ user }) {
    const [searchParams] = useSearchParams();

    const initialPlan = searchParams.get("plan") === "team" ? "team" : "pro";
    const initialCycle = searchParams.get("cycle") === "yearly" ? "yearly" : "monthly";
    const cancelled = searchParams.get("cancelled") === "1";

    const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
    const [cycle, setCycle] = useState(initialCycle);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const plan = PLAN_MAP[selectedPlanId] || PLAN_MAP.pro;
    const price = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const bonusCredits = cycle === "yearly" ? plan.creditsBonus * 12 : plan.creditsBonus;
    const priceUsd = (price / USD_VND_RATE).toFixed(2);

    async function handleCheckout() {
        setError("");
        setSubmitting(true);
        try {
            const res = await fetchApi("/plans/paypal/create-order", {
                method: "POST",
                body: JSON.stringify({ planId: selectedPlanId, cycle }),
            });
            window.location.href = res.data.approveUrl; // chuyển sang PayPal
        } catch (err) {
            setError(err.message || "Không thể tạo đơn thanh toán. Vui lòng thử lại.");
            setSubmitting(false);
        }
    }

    return (
        <section className="page">
            <div className="container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <Link to="/plans">Gói dịch vụ</Link>
                    <span>/</span>
                    <span>Thanh toán</span>
                </nav>

                <div className="page-header">
                    <h1 className="page-header__title">Thanh toán nâng cấp gói</h1>
                    <p className="page-header__sub">
                        Thanh toán qua PayPal để kích hoạt gói dịch vụ và nhận ngay Credits vào tài khoản.
                    </p>
                </div>

                <div className="checkout-grid">
                    <div className="panel checkout-main">
                        <h2 className="workspace-section-title">1. Chọn gói và chu kỳ thanh toán</h2>

                        <div className="checkout-plans">
                            {PLANS_LIST.filter((p) => p.id !== "free").map((p) => (
                                <label
                                    key={p.id}
                                    className={`checkout-option ${selectedPlanId === p.id ? "is-selected" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={p.id}
                                        checked={selectedPlanId === p.id}
                                        onChange={() => setSelectedPlanId(p.id)}
                                    />
                                    <div>
                                        <b className="checkout-option__title">{p.name}</b>
                                        <small className="checkout-option__sub">
                                            +{p.creditsBonus.toLocaleString("vi-VN")} Credits / tháng
                                        </small>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="profile-form__row checkout-fields">
                            <div className="tool-field">
                                <label className="tool-field__label" htmlFor="co-cycle">Chu kỳ thanh toán</label>
                                <select
                                    id="co-cycle"
                                    className="tool-field__control"
                                    value={cycle}
                                    onChange={(e) => setCycle(e.target.value)}
                                >
                                    <option value="monthly">Theo tháng</option>
                                    <option value="yearly">Theo năm (tiết kiệm 17%)</option>
                                </select>
                            </div>

                            <div className="tool-field">
                                <label className="tool-field__label" htmlFor="co-account">Tài khoản thụ hưởng</label>
                                <input
                                    id="co-account"
                                    type="text"
                                    className="tool-field__control"
                                    value={`${user.full_name} (${user.email})`}
                                    disabled
                                />
                            </div>
                        </div>

                        <h2 className="workspace-section-title">2. Phương thức thanh toán</h2>
                        <div className="payment-methods">
                            <label className="checkout-option is-selected">
                                <input type="radio" name="method" checked readOnly />
                                <div>
                                    <b className="checkout-option__title">PayPal</b>
                                    <small className="checkout-option__sub">
                                        Thanh toán bằng tài khoản PayPal hoặc thẻ Visa/Mastercard
                                    </small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <aside className="panel checkout-aside">
                        <h2 className="workspace-section-title">Tóm tắt đơn hàng</h2>

                        <div className="tool-summary">
                            <div className="tool-summary__row">
                                <span>Gói dịch vụ</span>
                                <b>{plan.name}</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Chu kỳ</span>
                                <b>{cycle === "yearly" ? "12 tháng" : "1 tháng"}</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Credits hiện có</span>
                                <b>{(user.credits ?? 0).toLocaleString("vi-VN")}</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Credits cộng thêm</span>
                                <b className="checkout-bonus">+{bonusCredits.toLocaleString("vi-VN")}</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Quy đổi PayPal</span>
                                <b>≈ {priceUsd} USD</b>
                            </div>
                            <div className="tool-summary__row checkout-total-row">
                                <span>Tổng thanh toán</span>
                                <strong className="checkout-total-price">{formatVnd(price)}</strong>
                            </div>
                        </div>

                        <p className="tool-notice">
                            Môi trường thử nghiệm PayPal Sandbox: không trừ tiền thật. Đăng nhập bằng tài khoản
                            mua hàng sandbox.
                        </p>

                        {cancelled && (
                            <p className="form-error">Bạn đã hủy thanh toán. Có thể thử lại bất cứ lúc nào.</p>
                        )}
                        {error && <p className="form-error">{error}</p>}

                        <button
                            type="button"
                            className="btn workspace-aside__submit"
                            disabled={submitting}
                            onClick={handleCheckout}
                        >
                            {submitting ? "Đang chuyển sang PayPal..." : "Thanh toán với PayPal"}
                        </button>

                        <Link className="btn ghost workspace-aside__reset" to="/plans">
                            &larr; Quay lại bảng giá
                        </Link>
                    </aside>
                </div>
            </div>
        </section>
    );
}