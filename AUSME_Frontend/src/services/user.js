import {authFetch} from './session';

const API_BASE = import.meta.env.VITE_API_BASE;

export const fetchResearcherProfile = async (auid, viewType = 'public', targetAuid = null) => {
    let url = `${API_BASE}/users/profile/${auid}/?view_type=${viewType}`;
    if (targetAuid) url += `&target_auid=${targetAuid}`;

    if (viewType === 'private' || viewType === 'inspect') {
        const res = await authFetch(url);
        if (!res.ok) throw new Error(`Could not load ${viewType} researcher profile`);
        return res.json();
    } else {
        const res = await fetch(url, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        if (!res.ok) throw new Error("Could not load public researcher profile");
        return res.json();
    }
};

export const findExpertsAI = async (keywords, viewType = 'public') => {
    const url = `${API_BASE}/users/find-expert/?view_type=${viewType}`;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({keywords})
    };

    try {
        let response;

        if (viewType === 'private') {
            response = await authFetch(url, options);
        } else {
            response = await fetch(url, options);
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to search for experts');
        }

        return await response.json();
    } catch (error) {
        console.error("Error in findExpertsAI:", error);
        throw error;
    }
};


export const fetchMeetTeam = async () => {
    try {
        const response = await fetch(`${API_BASE}/users/meet_team/`);
        if (!response.ok) throw new Error('Failed to fetch team data');
        return await response.json();
    } catch (error) {
        console.error("Error in fetchMeetTeam:", error);
        throw error;
    }
};


export const fetchAdminControlData = async (targetAuid = null) => {
    try {
        let url = `${API_BASE}/users/admin-control/`;
        if (targetAuid) {
            url += `?target_auid=${encodeURIComponent(targetAuid)}`;
        }

        const response = await authFetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch admin control data');
        }

        return await response.json();
    } catch (error) {
        console.error("Error in fetchAdminControlData:", error);
        throw error;
    }
};


export const toggleResearcherStatus = async (id, newStatus, targetType = 'researcher', targetAuid = null) => {
    try {
        let url = `${API_BASE}/users/admin-control/`;
        if (targetAuid) {
            url += `?target_auid=${encodeURIComponent(targetAuid)}`;
        }

        const response = await authFetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
                status: newStatus,
                target_type: targetType
            })
        });

        if (!response.ok) {
            let errorMsg = `Status ${response.status}: Failed to update`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                const errorText = await response.text();
                console.error("Server Error Response:", errorText);
            }
            throw new Error(errorMsg);
        }

        return await response.json();
    } catch (error) {
        console.error("Mutation Error in toggleResearcherStatus:", error);
        throw error;
    }
};


export const updatePublicVisibility = async (auid, newStatus, targetAuid = null) => {
    try {
        let url = `${API_BASE}/users/profile/${auid}/toggle-visibility/`;
        if (targetAuid) {
            url += `?target_auid=${targetAuid}`;
        }

        const response = await authFetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                public_status: newStatus
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update visibility');
        }

        return await response.json();
    } catch (error) {
        console.error("Visibility Mutation Error:", error);
        throw error;
    }
};


export const get_user_role = async (auid) => {
    try {
        const response = await fetch(`${API_BASE}/users/user_role/${auid}`);
        if (!response.ok) throw new Error('Failed to fetch team data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getting user role:", error);
        throw error;
    }
};

export const get_basic_researcher_info = async (auid) => {
    try {
        const response = await fetch(`${API_BASE}/users/reseracher_basic_info/${auid}`);
        if (!response.ok) throw new Error('Failed to fetch team data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getting user role:", error);
        throw error;
    }
};
