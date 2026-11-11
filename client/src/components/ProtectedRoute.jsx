import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, loading, children}) {
    if (loading) {
        return (
             <section className="page">
                <div className="container">
                    <div className="empty-box">Đang tải...</div>
                </div>
            </section>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    return children;
}