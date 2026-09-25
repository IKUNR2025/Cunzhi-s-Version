const API_BASE = import.meta.env.VITE_API_BASE;


export async function fetchColleges(viewType = 'public') {
    const res = await fetch(`${API_BASE}/users/colleges/?view_type=${viewType}`);
    if (!res.ok) throw new Error("Failed to fetch colleges");
    return res.json();
}

export async function fetchResearchers(viewType = 'public') {
    const res = await fetch(`${API_BASE}/users/researchers/?view_type=${viewType}`);
    if (!res.ok) throw new Error("Failed to fetch researchers");
    return res.json();
}



export async function researchers_lookup(viewType = 'public') {
    const res = await fetch(`${API_BASE}/users/researchers_lookup/?view_type=${viewType}`);
    if (!res.ok) throw new Error("Failed to fetch researchers");
    return res.json();
}


