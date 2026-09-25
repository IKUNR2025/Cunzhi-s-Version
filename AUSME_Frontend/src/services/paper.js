import {authFetch} from './session';

const API_BASE = import.meta.env.VITE_API_BASE;


export async function updatePaperStatus(id, newStatus, targetAuid = null) {
    let url = `${API_BASE}/papers/${id}/toggle_status/`;
    if (targetAuid) {
        url += `?target_auid=${targetAuid}`;
    }

    const res = await authFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({status: newStatus}),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
    }
    return res.json();
}


export async function fetchTopics(viewType = 'public') {
    const url = `${API_BASE}/topics/?view_type=${viewType}`;

    if (viewType === 'private') {
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Failed to fetch internal topics");
        return res.json();
    } else {
        const res = await fetch(url, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        if (!res.ok) throw new Error("Failed to fetch public topics");
        return res.json();
    }
}


export async function fetchPapers({cursorUrl = null, search = "", filters = [], sort = "recent"} = {}) {
    let url = cursorUrl;

    if (!url) {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("q", search);
        if (sort) queryParams.append("sort", sort);

        filters.forEach(f => {
            if (f.type === 'author') queryParams.append("author", f.value);
            if (f.type === 'college') queryParams.append("college", f.value);
        });

        url = `${API_BASE}/papers/?${queryParams.toString()}`;
    }

    const res = await authFetch(url);
    if (!res.ok) throw new Error("Failed to fetch papers");
    return res.json();
}

export async function fetchPaperDescription(paperId) {
  const res = await authFetch(`${API_BASE}/papers/${paperId}/description/`);
  if (!res.ok) throw new Error("Failed to fetch paper description");
  return res.json();
}

export async function fetchPaperCount(filters = []) {
    const queryParams = new URLSearchParams();
    filters.forEach(f => {
        if (f.type === 'author') queryParams.append('author', f.value);
        if (f.type === 'college') queryParams.append('college', f.value);
    });
    const res = await authFetch(`${API_BASE}/papers/count/?${queryParams.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch paper count");
    return res.json();
}