import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { fetchApi } from "../lib/api";

function formatVnd(amount) {
    return `${Number(amount || 0).toLocaleString("vi-VN")}đ`;
}

export default function PaypalReturn({ setUser }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [receipt, setReceipt] = useState(null);
    const calledRef = useRef(false);

    useEffect(() => {
        if (calledRef.current) return;
        calledRef.current = true;

        if (!token) {
            setError("Thiếu mã đơn hàng từ PayPal.");
            setLoading(false);
            return;
        }

        fetchApi("/plans/paypal/capture", {
            method: "POST",
            body: JSON.stringify({ orderId: token }),
        })
            .then((res) => {
                setUser(res.data.user);
                setReceipt(res.data.receipt);
            })
            .catch((err) => setError(err.message || "Không thể xác nhận thanh toán."))
            .finally(() => setLoading(false));
    }, [token, setUser]);

    return (
        <section className="page">
            <div className="container">
                {loading && (
                    <div className="panel">
                        <p>Đang xác nhận thanh toán với PayPal, vui lòng không đóng trang...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="panel">
                        <h2 className="checkout-receipt__title">Thanh toán chưa hoàn tất</h2>
                        <p className="form-error">{error}</p>
                        <Link className="btn" to="/checkout">Thử lại</Link>
                    </div>
                )}

                {!loading && receipt && (
                    <div className="panel checkout-receipt">
                        <div className="checkout-receipt__head">
                            <span className="status-tag success">Giao dịch thành công</span>
                            <h2 className="checkout-receipt__title">Đã kích hoạt {receipt.planName}</h2>
                            <p className="checkout-receipt__meta">
                                Mã giao dịch <b>#{receipt.transactionCode}</b> &bull;{" "}
                                {receipt.paidAt && new Date(receipt.paidAt).toLocaleString("vi-VN")}
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
                                <strong className="checkout-total-price">
                                    {formatVnd(receipt.amount)} (≈ {receipt.amountUsd} USD)
                                </strong>
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
                )}
            </div>
        </section>
    );
}