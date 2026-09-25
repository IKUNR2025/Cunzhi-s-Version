const API_BASE = import.meta.env.VITE_API_BASE;

let accessToken = localStorage.getItem("access_token") || null;
let clockOffset = 0;
let currentUser = null;
let isLoggingOut = false;

export const getAccessToken = () => accessToken;
export const getCurrentUser = () => currentUser;

export const setAccessToken = (token) => {
    accessToken = token;
    if (token) {
        localStorage.setItem("access_token", token);
        try {
            const payload = JSON.parse(window.atob(token.split(".")[1]));
            currentUser = {
                auid: (payload.username || payload.auid || payload.user_id)?.toString().toLowerCase(),
            };
        } catch (e) {
            console.error("Token decode error:", e);
            currentUser = null;
        }
    } else {
        accessToken = null;
        currentUser = null;
        localStorage.removeItem("access_token");
    }
};

export const loginUser = async (payload) => {
    const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login Error");

    try {
        const payload = JSON.parse(atob(data.access.split(".")[1]));
        const serverTime = payload.iat;
        const localTime = Math.floor(Date.now() / 1000);
        clockOffset = serverTime - localTime;
    } catch (e) {
        console.warn("Clock offset calculation failed", e);
    }

    setAccessToken(data.access);
    if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
    return data;
};


export const isAccessTokenValid = () => {
    if (!accessToken) {
        accessToken = localStorage.getItem("access_token");
    }

    const token = getAccessToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const localTime = Math.floor(Date.now() / 1000);
        const adjustedTime = localTime + clockOffset;
        return payload.exp > (adjustedTime + 58);
    } catch (e) {
        return false;
    }
};


export const authFetch = async (url, options = {}) => {
    if (!isAccessTokenValid()) {
        try {
            await refreshAccessToken();
        } catch (err) {
            logoutUser();
            throw new Error("Session expired, please login again");
        }
    }

    const token = getAccessToken();

    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers, // Allow overriding/adding headers from caller
            Authorization: `Bearer ${token}`,
        },
    });
};


export const refreshAccessToken = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) throw new Error("No refresh token available");

    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({refresh}),
    });

    if (!res.ok) {
        localStorage.removeItem("refresh_token");
        throw new Error("Session expired");
    }

    const data = await res.json();
    setAccessToken(data.access);
    // Some backends rotate refresh tokens, some don't. This covers both.
    if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
};

export const getTokenRemainingTime = () => {
    const token = getAccessToken();
    if (!token) return 0;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const localTime = Math.floor(Date.now() / 1000);
        const adjustedTime = localTime + clockOffset;
        return Math.max(0, payload.exp - adjustedTime);
    } catch (e) {
        return 0;
    }
};


export const logoutUser = () => {
    if (isLoggingOut) return;
    isLoggingOut = true;
    accessToken = null;
    currentUser = null;
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access_token");
    window.location.replace("/internal/login");
};


export const submitFeedback = async (feedbackPayload) => {
    return authFetch(`${API_BASE}/users/feedback/`, {
        method: "POST",
        body: JSON.stringify(feedbackPayload),
    });
};


export const registerResearcher = async (payload) => {
    if (!isAccessTokenValid()) {
        try {
            await refreshAccessToken();
        } catch (err) {
            return {requires_login: true};
        }
    }

    const token = getAccessToken();

    const res = await fetch(`${API_BASE}/auth/researcher/register/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type");
    let data = {};

    if (contentType && contentType.includes("application/json")) {
        try {
            data = await res.json();
        } catch (e) {
            data = {};
        }
    }

    if (!res.ok) {
        return {success: false, error: data.error || data.detail || `Server Error: ${res.status}`};
    }

    return {success: true, ...data};
};
