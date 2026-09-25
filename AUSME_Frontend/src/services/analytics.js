import {authFetch, getAccessToken} from './session';

const API_BASE = import.meta.env.VITE_API_BASE;

export const trackActivityAPI = async (auid, action, details = {}) => {
    const payload = {
        auid: auid,
        action: action,
        ...details
    };

    const token = getAccessToken();

    try {
        if (token) {
            const res = await authFetch(`${API_BASE}/analytics/track/`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return await res.json();
        } else {
            const res = await fetch(`${API_BASE}/analytics/track/`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            return await res.json();
        }
    } catch (err) {
        console.error("Tracking failed:", err);
    }
};

export const fetchRecentActivityAPI = async (auid) => {
    if (!auid) return [];
    try {
        const res = await authFetch(`${API_BASE}/analytics/recent/?auid=${auid}`);
        if (!res.ok) throw new Error("Failed to fetch activity");
        return await res.json();
    } catch (err) {
        console.error("Fetch activity failed:", err);
        return [];
    }
};


export const fetchUserStatsAPI = async (auid) => {
    if (!auid) return {internal_views: 0, external_views: 0, growth: "0%"};
    try {
        const res = await authFetch(`${API_BASE}/analytics/stats/${auid}/`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        return await res.json();
    } catch (err) {
        console.error("Fetch stats failed:", err);
        return {internal_views: 0, external_views: 0, growth: "0%"};
    }
};