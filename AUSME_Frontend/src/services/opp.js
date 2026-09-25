import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;


export const fetchOpenAgencies = async () => {
    try {
        const response = await axios.get(`${API_BASE}/opp/agencies_open/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching open agencies:", error);
        throw error;
    }
};

export const fetchOpenOpportunities = async ({filters, pageParam = null}) => {
    const {
        agencyId,
        activeSearch,
        recommendMode,
        auid,
        bookmarksMode: favoritesMode
    } = filters;

    let url = pageParam;
    if (!url) {
        url = favoritesMode
            ? `${API_BASE}/opp/opportunities/favorites/`
            : `${API_BASE}/opp/opportunities_open/`;
    }

    const params = pageParam ? {} : {
        ...(agencyId && {agency_id: agencyId}),
        ...(activeSearch && {q: activeSearch}),
        ...(recommendMode && auid && {recommend_for: auid}),
        ...(favoritesMode && auid && {auid: auid}),
        ...(!favoritesMode && !recommendMode && auid && {auid: auid})
    };

    try {
        const response = await axios.get(url, {params});
        return response.data;
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        throw error;
    }
};

export const toggleFavoriteOpp = async (auid, oppId) => {
    const response = await axios.post(`${API_BASE}/opp/opportunities/favorite/toggle/`, {
        auid,
        opp_id: oppId
    });
    return response.data;
};


export const fetchAllAgencies = async () => {
    try {
        const response = await axios.get(`${API_BASE}/opp/agencies_all/`);
        return response.data; // Returns array of all agencies with total counts
    } catch (error) {
        console.error("Error fetching all agencies:", error);
        throw error;
    }
};


export const fetchAllOpportunities = async (params = {}) => {
    try {
        const response = await axios.get(`${API_BASE}/opp/opportunities_all/`, {params});
        return response.data;
    } catch (error) {
        console.error("Error fetching all opportunities:", error);
        throw error;
    }
};