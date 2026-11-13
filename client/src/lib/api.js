const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchApi(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra khi kết nối máy chủ");
    }
    return result;
}

export function mapUserFromDb(dbUser) {
    if (!dbUser) return null;
    return {
        id: dbUser.id,
        name: dbUser.full_name || dbUser.name || "",
        email: dbUser.email,
        role: dbUser.role || "user",
        birth: dbUser.birth_year ? String(dbUser.birth_year) : "",
        phone: dbUser.phone || "",
        address: dbUser.address || "",
        plan: dbUser.plan_type || "free",
        credits: dbUser.credits ?? 10,
        status: dbUser.status || "active",
    };
}