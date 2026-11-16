import { useEffect, useState } from "react";
import { fetchApi } from "./api";

export function useServices() {
    const [services, setServices] = useState(null);

    useEffect(() => {
        fetchApi("/services")
            .then((res) => setServices(Array.isArray(res.data) ? res.data : []))
            .catch(() => setServices([]));
    }, []);

    return services;
}