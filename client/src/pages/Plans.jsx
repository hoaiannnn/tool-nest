import { useState } from "react";
import { Link } from "react-router-dom";
import { PLANS_LIST, PLAN_FAQS } from "../data/plansData";

function formatVnd(amount) {
    if (!amount) return "0đ";
    return `${amount.toLocaleString("vi-VN")}đ`;
}

export default function Plans({ user }) {
    const [cycle, setCycle] = useState("monthly");
    const currentPlan = user?.plan_type || "free";

    return (
        <section className="page">
            <div className="container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <span>Gói dịch vụ</span>
                </nav>

                <div className="page-header plans-header">
                    <div>
                        <h1 className="page-header__title">Bảng giá gói dịch vụ</h1>
                        <p className="page-header__sub">
                            Chọn gói phù hợp với nhu cầu xử lý tài liệu của bạn. Nâng cấp bất cứ lúc nào.
                        </p>
                    </div>

                    <div className="billing-toggle" role="group" aria-label="Chu kỳ thanh toán">
                        <button
                            type="button"
                            className={`billing-toggle__btn ${cycle === "monthly" ? "is-active" : ""}`}
                            onClick={() => setCycle("monthly")}
                        >
                            Theo tháng
                        </button>
                        <button
                            type="button"
                            className={`billing-toggle__btn ${cycle === "yearly" ? "is-active" : ""}`}
                            onClick={() => setCycle("yearly")}
                        >
                            Theo năm <span className="billing-toggle__save">-17%</span>
                        </button>
                    </div>
                </div>

                <div className="plans-grid">
                    {PLANS_LIST.map((plan) => {
                        const price = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
                        const isCurrent = Boolean(user) && currentPlan === plan.id;

                        return (
                            <article
                                key={plan.id}
                                className={`panel plan-card ${plan.featured ? "plan-card--featured" : ""}`}
                            >
                                <div className="plan-card__head">
                                    <span className={`status-tag ${plan.featured ? "success" : "neutral"}`}>
                                        {plan.badge}
                                    </span>
                                    {isCurrent && <span className="status-tag coming-soon">Đang sử dụng</span>}
                                </div>

                                <h2 className="plan-card__name">{plan.name}</h2>
                                <p className="plan-card__desc">{plan.desc}</p>

                                <div className="plan-card__price-box">
                                    <strong className="plan-card__price">{formatVnd(price)}</strong>
                                    <span className="plan-card__period">
                                        {price === 0 ? "/ trọn đời" : cycle === "yearly" ? "/ năm" : "/ tháng"}
                                    </span>
                                </div>

                                <ul className="plan-card__features">
                                    {plan.features.map((feat) => (
                                        <li key={feat} className="plan-card__feature-item">
                                            <span className="plan-card__check">&#10003;</span>
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="plan-card__foot">
                                    {plan.id === "free" ? (
                                        <Link className="btn ghost plan-card__btn" to="/services">
                                            {isCurrent ? "Đang dùng Gói Miễn phí" : "Khám phá công cụ"}
                                        </Link>
                                    ) : (
                                        <Link
                                            className={`btn ${plan.featured ? "" : "ghost"} plan-card__btn`}
                                            to={`/checkout?plan=${plan.id}&cycle=${cycle}`}
                                        >
                                            {isCurrent ? "Gia hạn thêm Credits" : `Nâng cấp ${plan.name}`}
                                        </Link>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="plans-faq">
                    <h2 className="plans-faq__title">Câu hỏi thường gặp</h2>
                    <div className="faq-grid">
                        {PLAN_FAQS.map((item) => (
                            <div key={item.q} className="panel faq-card">
                                <h3 className="faq-card__q">{item.q}</h3>
                                <p className="faq-card__a">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}