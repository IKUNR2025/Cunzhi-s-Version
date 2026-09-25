import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useQueryClient} from '@tanstack/react-query';
import {NAVIGATION_CONFIG} from '../../config/navigation';
import styles from '../../styles/dashboard/Sidebar.module.css';
import {useHeadshots} from "../HeadshotContext";

const logoAssets = import.meta.glob('../../assets/logo/*.png', {eager: true});

const getLogo = (type) => {
    const key = `../../assets/logo/AUSME_${type}.png`;
    return logoAssets[key]?.default || "";
};

const Sidebar = ({user_info, isCollapsed, setIsCollapsed, viewType, targetAuid}) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const hasAnimatedOnLoad = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const {getMiniHeadshot} = useHeadshots();

    const user = user_info;

    const filteredMenu = NAVIGATION_CONFIG.filter(item => item.roles.includes(user.role));
    const mainNav = filteredMenu.filter(item => item.id !== 'about');
    const aboutItem = filteredMenu.find(item => item.id === 'about');

    const dashboardBase = viewType === 'inspect'
        ? `/internal/inspect/dashboard/${targetAuid}`
        : `/internal/dashboard`;

    const isDashboardActive = location.pathname === dashboardBase || location.pathname === `${dashboardBase}/`;

    useEffect(() => {
        if (isMobileOpen) {
            setShowLabels(true);
        }
        if (isCollapsed) {
            setShowLabels(false);
        } else {
            const t = setTimeout(() => setShowLabels(true), 100);
            return () => clearTimeout(t);
        }
    }, [setIsCollapsed, isCollapsed, isMobileOpen]);

    const handleNavigation = (id) => {
        const currentAuid = user?.auid || user?.username;
        if (id === 'my_profile') {
            if (currentAuid && currentAuid !== "Guest") {
                navigate(`${dashboardBase}/profile/${currentAuid}`);
            } else {
                navigate('/internal/login');
            }
        } else {
            navigate(`${dashboardBase}/${id}`);
        }
        setIsMobileOpen(false);
    };

    const renderNavItem = (item) => {
        const currentPath = location.pathname;
        const currentAuid = user?.auid || user?.username;
        let isActive = currentPath.endsWith(item.id);

        if (item.id === 'my_profile' && currentAuid) {
            isActive = currentPath.includes(`/profile/${currentAuid}`);
        }

        return (
            <div
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.id === 'about' ? styles.aboutNavItem : ''}`}
                onClick={() => handleNavigation(item.id)}
                data-tooltip={isCollapsed ? item.label : ""}
            >
                {isActive && (
                    <motion.div
                        layoutId="activeGlow"
                        className={styles.activeGlow}
                        transition={{type: "spring", stiffness: 300, damping: 30}}
                    />
                )}
                <i className={`${item.icon} ${styles.navIcon}`}></i>
                <AnimatePresence>
                    {showLabels && (
                        <motion.span
                            initial={{opacity: 0}}
                            animate={{opacity: 1, transition: {delay: 0.3}}}
                            exit={{opacity: 0, transition: {duration: 0.1}}}
                            className={styles.linkLabel}
                        >
                            {item.label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <>
            <button className={styles.mobileToggle} onClick={() => setIsMobileOpen(!isMobileOpen)}>
                <i className={`fa-solid ${isMobileOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
            </button>

            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className={styles.mobileOverlay}
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: (typeof window !== 'undefined' && window.innerWidth <= 768) ? 280 : (isCollapsed ? 85 : 280),
                    x: (typeof window !== 'undefined' && window.innerWidth <= 768) ? (isMobileOpen ? 0 : -280) : 0
                }}
                transition={{type: "tween", ease: [0.4, 0, 0.2, 1], duration: 1.1}}
                className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
            >
                <div className={styles.header}>
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={isCollapsed && !isMobileOpen ? 'collapsed' : 'expanded'}
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                            transition={{duration: 0.3}}
                            src={isCollapsed && !isMobileOpen ? getLogo('vertical') : getLogo('horizontal')}
                            alt="Logo"
                            className={isCollapsed && !isMobileOpen ? styles.logoVert : styles.logoHoriz}
                            onClick={() => {
                                navigate(dashboardBase);
                                setIsCollapsed(true);
                            }}
                        />
                    </AnimatePresence>
                </div>

                <div className={styles.profileWrapper}>
                    <div
                        className={`${styles.glassCard} ${styles.clickableAvatar} ${isDashboardActive ? styles.active : ''}`}
                        onClick={() => navigate(dashboardBase)}
                        data-tooltip={isCollapsed ? "Dashboard" : ""}
                    >
                        {isDashboardActive && (
                            <motion.div
                                layoutId="activeGlow"
                                className={styles.activeGlow}
                                transition={{type: "spring", stiffness: 300, damping: 30}}
                            />
                        )}

                        <div className={styles.avatarWrapper}>
                            <img src={getMiniHeadshot(user.username)} alt={user.username} className={styles.avatar}/>
                            <div className={styles.onlineIndicator}/>
                        </div>
                        <AnimatePresence>
                            {showLabels && (
                                <motion.div
                                    initial={{opacity: 0, width: 0}}
                                    animate={{opacity: 1, width: 'auto', transition: {delay: 0.3}}}
                                    exit={{opacity: 0, width: 0, transition: {duration: 0.1}}}
                                    className={styles.userMeta}
                                >
                                    <p className={styles.username}>{user.username}</p>
                                    <span className={styles.roleLabel}>{user.role}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <nav className={styles.navStack}>
                    {mainNav.map((item) => renderNavItem(item))}

                    <div style={{flex: 1}}/>

                    {aboutItem && (
                        <div className={styles.aboutWrapper}>
                            {renderNavItem(aboutItem)}
                        </div>
                    )}
                </nav>

                <div className={styles.footer}>
                    <motion.button
                        className={styles.toggleBtn}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}/>
                        {showLabels && <span>Collapse Menu</span>}
                    </motion.button>

                    <button className={styles.logoutBtn} onClick={() => {
                        queryClient.clear();
                        localStorage.clear();
                        navigate('/internal/login');
                    }}>
                        <i className="fa-solid fa-power-off"></i>
                        {showLabels && <span>Sign Out</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;