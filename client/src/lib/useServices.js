import { useEffect, useState } from "react";
import { fetchApi } from "./api";
import { SERVICES_LIST } from "../data/servicesData";

export function useServices() {
    const [services, setServices] = useState(null);

    useEffect(() => {
        fetchApi("/services")
            .then((res) => {
                setServices(Array.isArray(res.data) &&
                    res.data.length ? res.data : SERVICES_LIST
                )
            }).catch(() => {
                setServices(SERVICES_LIST);
            })
    }, []);

    return services;
}