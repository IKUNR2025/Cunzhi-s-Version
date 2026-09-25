export const NAVIGATION_CONFIG = [
    {
        id: "admin_control",
        label: "Admin Control",
        icon: "fas fa-user-shield nav-icon",
        roles: ["admin", "super_admin"],
    },
    {
        id: "find_ausme",
        label: "Find AUSME",
        icon: "fas fa-search",
        roles: ["researcher", "admin", "super_admin"],
    },
    {
        id: 'opportunities',
        label: 'Opportunity',
        icon: 'fa-solid fa-magnifying-glass-dollar nav-icon',
        roles: ['admin', 'super_admin', 'researcher']
    },
    {
        id: 'papers',
        label: 'AUSME papers',
        icon: 'fas fa-file-alt nav-icon',
        roles: ['admin', 'super_admin', 'researcher']
    },
    {
        id: "my_profile",
        label: "My Profile",
        icon: "fas fa-user-cog nav-icon",
        roles: ["researcher", "admin", "super_admin"],
    },
    {
        id: "about",
        label: "About AUSME",
        icon: "fas fa-circle-info nav-icon",
        roles: ["researcher", "admin", "super_admin"],
    }
];