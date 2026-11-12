import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { PLANS_LIST, PLAN_MAP } from "../data/plansData";
import { fetchApi } from "../lib/api";

function formatVnd(amount) {
    return `${Number(amount || 0).toLocaleString("vi-VN")}đ`;
}

function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
}

const METHOD_LABEL = {
    momo: "Ví MoMo",
    vietqr: "VietQR",
    card: "Thẻ thanh toán",
};

export default function Checkout({ user, setUser }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const initialPlan = searchParams.get("plan") === "team" ? "team" : "pro";
    const initialCycle = searchParams.get("cycle") === "yearly" ? "yearly" : "monthly";

    const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
    const [cycle, setCycle] = useState(initialCycle);
    const [method, setMethod] = useState("momo");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [receipt, setReceipt] = useState(null);

    const plan = PLAN_MAP[selectedPlanId] || PLAN_MAP.pro;
    const price = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const bonusCredits = cycle === "yearly" ? plan.creditsBonus * 12 : plan.creditsBonus;

    async function handleCheckout() {
        setError("");
        setSubmitting(true);
        try {
            const res = await fetchApi("/plans/checkout", {
                method: "POST",
                body: JSON.stringify({ planId: selectedPlanId, cycle, method }),
            });
            setUser(res.data.user); // Header và Hồ sơ nhận gói + Credits mới ngay
            setReceipt(res.data.receipt);
        } catch (err) {
            setError(err.message || "Không thể xử lý thanh toán. Vui lòng thử lại.");
        } finally {
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
                        Hoàn tất thanh toán để kích hoạt gói dịch vụ và nhận ngay Credits vào tài khoản.
                    </p>
                </div>

                {receipt ? (
                    <div className="panel checkout-receipt">
                        <div className="checkout-receipt__head">
                            <span className="status-tag success">Giao dịch thành công</span>
                            <h2 className="checkout-receipt__title">Đã kích hoạt {receipt.planName}</h2>
                            <p className="checkout-receipt__meta">
                                Mã giao dịch <b>#{receipt.transactionCode}</b> &bull; {formatDate(receipt.paidAt)}
                            </p>
                        </div>

                        <div className="tool-summary">
                            <div className="tool-summary__row">
                                <span>Gói</span>
                                <b>{receipt.planName} ({receipt.cycle})</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Credits vừa cộng</span>
                                <b className="checkout-bonus">+{receipt.addedCredits.toLocaleString("vi-VN")}</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Số dư Credits hiện tại</span>
                                <b>{receipt.totalCredits.toLocaleString("vi-VN")}</b>
                            </div>
                            <div className="tool-summary__row">
                                <span>Hiệu lực đến</span>
                                <b>{new Date(receipt.expiresAt).toLocaleDateString("vi-VN")}</b>
                            </div>
                            <div className="tool-summary__row checkout-total-row">
                                <span>Đã thanh toán</span>
                                <strong className="checkout-total-price">{formatVnd(receipt.amount)}</strong>
                            </div>
                        </div>

                        <div className="checkout-receipt__actions">
                            <button type="button" className="btn" onClick={() => navigate("/profile")}>
                                Xem hồ sơ cá nhân
                            </button>
                            <button type="button" className="btn ghost" onClick={() => navigate("/services")}>
                                Sử dụng công cụ ngay
                            </button>
                        </div>
                    </div>
                ) : (
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
                                {[
                                    { id: "momo", title: "Ví điện tử MoMo", sub: "Kích hoạt ngay sau khi thanh toán" },
                                    { id: "vietqr", title: "Chuyển khoản ngân hàng (VietQR)", sub: "Quét mã QR qua ứng dụng ngân hàng" },
                                    { id: "card", title: "Thẻ ATM nội địa / Quốc tế", sub: "Visa, Mastercard" },
                                ].map((m) => (
                                    <label
                                        key={m.id}
                                        className={`checkout-option ${method === m.id ? "is-selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="method"
                                            value={m.id}
                                            checked={method === m.id}
                                            onChange={() => setMethod(m.id)}
                                        />
                                        <div>
                                            <b className="checkout-option__title">{m.title}</b>
                                            <small className="checkout-option__sub">{m.sub}</small>
                                        </div>
                                    </label>
                                ))}
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
                                    <span>Phương thức</span>
                                    <b>{METHOD_LABEL[method]}</b>
                                </div>
                                <div className="tool-summary__row checkout-total-row">
                                    <span>Tổng thanh toán</span>
                                    <strong className="checkout-total-price">{formatVnd(price)}</strong>
                                </div>
                            </div>

                            <p className="tool-notice">
                                Đây là thanh toán giả lập cho đồ án: hệ thống không trừ tiền thật.
                            </p>

                            {error && <p className="form-error">{error}</p>}

                            <button
                                type="button"
                                className="btn workspace-aside__submit"
                                disabled={submitting}
                                onClick={handleCheckout}
                            >
                                {submitting ? "Đang xử lý giao dịch..." : "Xác nhận & Thanh toán"}
                            </button>

                            <Link className="btn ghost workspace-aside__reset" to="/plans">
                                &larr; Quay lại bảng giá
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </section>
    );
}