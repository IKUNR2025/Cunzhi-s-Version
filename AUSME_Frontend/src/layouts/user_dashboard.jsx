import React, {useEffect, useMemo, useState} from 'react';
import {useParams, useOutletContext, useNavigate} from "react-router-dom";
import "../styles/dashboard/dashboard.css";
import {useHeadshots} from "../components/HeadshotContext";
import {get_basic_researcher_info} from '../services/user.js'
import {fetchRecentActivityAPI, fetchUserStatsAPI} from '../services/analytics.js';
import IntelligentOppStack from '../components/opportunities/IntelligentOppStack';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faBuildingColumns,
    faGlobe,
    faArrowTrendUp,
    faArrowTrendDown,
    faClockRotateLeft,
    faInbox,
    faFolderPlus,
    faMagnifyingGlassChart,
    faBell,
    faBellSlash,
    faEye,
    faPencil
} from '@fortawesome/free-solid-svg-icons';

const Digit = ({digit}) => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        setOffset(digit * 50);
    }, [digit]);

    return (
        <div className="digit-container">
            <div
                className="digit-strip"
                style={{transform: `translateY(-${offset}px)`}}
            >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <div key={n} className="digit-unit">{n}</div>
                ))}
            </div>
        </div>
    );
};

const RollingNumber = ({number}) => {
    const digits = Array.from(String(number), Number);

    return (
        <div className="rolling-number-wrapper">
            {digits.map((d, i) => (
                <Digit key={i} digit={d}/>
            ))}
        </div>
    );
};

function UserDashboard({viewType: propViewType}) {
    const {targetAuid} = useParams();
    const context = useOutletContext();
    const viewType = propViewType || context?.viewType;
    const isInspectMode = viewType === 'inspect';

    const {getMiniHeadshot} = useHeadshots();
    const [userInfo, setUserInfo] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [stats, setStats] = useState({
        internal: 0,
        external: 0,
        internal_growth: "0%",
        external_growth: "0%"
    });
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    const realUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch (e) {
            return null;
        }
    }, []);

    const effectiveAuid = isInspectMode ? targetAuid : realUser?.username;
    const currentAgencyId = realUser?.agency_id;

    const handleProfileClick = (newAuid) => {
        const basePath = isInspectMode
            ? `/internal/inspect/dashboard/${targetAuid}/profile/`
            : viewType === 'private'
                ? `/internal/dashboard/profile/`
                : `/public/profile/`;

        navigate(`${basePath}${newAuid}`);
        window.scrollTo(0, 0);
    };

    const filteredRecentActivity = useMemo(() => {
        return recentActivity.filter(act => act.action_type === 'search');
    }, [recentActivity]);

    const handleRecentSearchClick = (act) => {
        navigate(act.url, {
            state: {autoSearchQuery: act.search_query}
        });
    };

    const formatActivityDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 84400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        if (!effectiveAuid) return;

        const refreshDynamicData = async () => {
            try {
                const [activityData, statsData] = await Promise.all([
                    fetchRecentActivityAPI(effectiveAuid),
                    fetchUserStatsAPI(effectiveAuid)
                ]);

                setRecentActivity(activityData);
                setStats({
                    internal: statsData.internal_views,
                    external: statsData.external_views,
                    internal_growth: statsData.internal_growth,
                    external_growth: statsData.external_growth
                });
            } catch (err) {
                console.error("Failed to refresh dynamic analytics:", err);
            }
        };

        const loadInitialData = async () => {
            try {
                const userData = await get_basic_researcher_info(effectiveAuid);
                setUserInfo(userData);
                await refreshDynamicData();
                setLoading(false);
                setTimeout(() => setIsVisible(true), 50);
            } catch (err) {
                console.error("Initial load failed:", err);
                setLoading(false);
            }
        };

        loadInitialData();

        const interval = setInterval(refreshDynamicData, 30000);
        return () => clearInterval(interval);
    }, [effectiveAuid]);

    if (loading) return (
        <div className="dashboard-loader">
            <div className="spinner"></div>
            <p>Authenticating Professional Profile...</p>
        </div>
    );

    const displayUser = userInfo?.employee

    return (
        <div className={`dashboard-container ${isVisible ? 'reveal-active' : 'reveal-hidden'}`}>
            {isInspectMode && (
                <div className="inspect-banner-alert">
                    <FontAwesomeIcon icon={faEye}/>
                    <span>INSPECT MODE: Viewing Portal as {displayUser?.first_name} {displayUser?.last_name} ({targetAuid})</span>
                </div>
            )}

            <section className="hero-profile-section">
                <div className="hero-overlay"></div>
                <div className="profile-centerpiece">
                    <div className="avatar-container-stack">
                        <div className="avatar-outer-ring">
                            <div className="avatar-inner-glow">
                                <img
                                    src={getMiniHeadshot(displayUser?.auid)}
                                    alt={displayUser?.first_name}
                                    className="hero-headshot"
                                />
                            </div>
                            <div className="edit-anchor-point">
                                <button
                                    className="liquid-pencil-button"
                                    onClick={() => handleProfileClick(effectiveAuid)}
                                >
                                    <div className="liquid-pencil-icon">
                                        <FontAwesomeIcon icon={faPencil}/>
                                    </div>
                                    <span className="liquid-text-reveal">Edit Profile</span>
                                    <div className="liquid-glow-ring"></div>
                                </button>
                            </div>
                        </div>

                        <div className="advanced-badge-wrapper">
                            <div className="badge-glow"></div>
                            <span className="welcome-badge">Researcher Portal</span>
                        </div>
                    </div>

                    <div className="hero-welcome-text">
                        <h1>{isInspectMode ? "Viewing Profile:" : "Welcome back,"} <span
                            className="name-highlight">{displayUser?.first_name} {displayUser?.last_name}</span></h1>
                        <div className="professional-meta">
                            <span className="meta-item">{displayUser?.title}</span>
                            <span className="meta-divider">|</span>
                            <span className="meta-item">{displayUser?.department_name}</span>
                            <span className="meta-divider">|</span>
                            <span className="meta-item">{displayUser?.college_name}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="dashboard-content-wrapper">
                <div className="metrics-grid-centered slide-stagger-1">
                    <div className="metric-card-minimal">
                        <div className="metric-value-container">
                            <RollingNumber number={stats.internal}/>
                        </div>
                        <div className="metric-info-stack">
                            <span className="metric-label">
                                Internal Views
                            </span>
                            <span
                                className={`trend-badge ${stats.internal_growth.startsWith('-') ? 'negative' : 'positive'}`}>
                                <FontAwesomeIcon
                                    icon={stats.internal_growth.startsWith('-') ? faArrowTrendDown : faArrowTrendUp}/> {stats.internal_growth}
                            </span>
                        </div>
                    </div>

                    <div className="metric-card-minimal">
                        <div className="metric-value-container">
                            <RollingNumber number={stats.external}/>
                        </div>
                        <div className="metric-info-stack">
                            <span className="metric-label">
                                External Views
                            </span>
                            <span
                                className={`trend-badge ${stats.external_growth.startsWith('-') ? 'negative' : 'positive'}`}>
                                <FontAwesomeIcon
                                    icon={stats.external_growth.startsWith('-') ? faArrowTrendDown : faArrowTrendUp}/> {stats.external_growth}
                            </span>
                        </div>
                    </div>
                </div>

                <main className="dashboard-grid-layout">
                    <div className="grid-main-column slide-stagger-2">
                        <IntelligentOppStack
                            effectiveAuid={effectiveAuid}
                            currentAgencyId={currentAgencyId}
                            viewType={viewType}
                            targetAuid={targetAuid}
                        />

                        <section className="dashboard-section formal-3d-box">
                            <div className="section-header-modern">
                                <div className="header-left">
                                    <FontAwesomeIcon icon={faFolderPlus} className="header-accent-icon"/>
                                    <h3>Newly Added Items</h3>
                                </div>
                            </div>
                            <div className="updates-content-area">
                                <div className="empty-state-formal">
                                    <div className="empty-icon-wrap-navy">
                                        <FontAwesomeIcon icon={faInbox}/>
                                    </div>
                                    <p>No new items have been added to your feed today.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="grid-sidebar slide-stagger-3">
                        <section className="dashboard-section activity-sidebar-formal">
                            <div className="section-header-modern">
                                <div className="header-left">
                                    <FontAwesomeIcon icon={faClockRotateLeft} className="sidebar-accent-icon"/>
                                    <h3>Recent Activity</h3>
                                </div>
                            </div>
                            <div className="activity-timeline">
                                {filteredRecentActivity.length > 0 ? (
                                    filteredRecentActivity.map(act => (
                                        <div
                                            key={act.id}
                                            className="timeline-item clickable-activity"
                                            onClick={() => handleRecentSearchClick(act)}
                                        >
                                            <div className="timeline-marker-pulse"></div>
                                            <div className="timeline-content">
                                                <div className="activity-row-header">
                                                    <FontAwesomeIcon
                                                        icon={faMagnifyingGlassChart}
                                                        className="activity-mini-icon"/>
                                                    <span className="timeline-tag">{`${act.display_type}`}</span>
                                                </div>
                                                <p className="timeline-query">
                                                    {`"${act.search_query}"`}
                                                </p>
                                                <span
                                                    className="timeline-date">{formatActivityDate(act.timestamp)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="notification-empty-state" style={{padding: '20px 0'}}>
                                        <p>No recent searches found.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="dashboard-section notification-box-modern formal-3d-box">
                            <div className="section-header-modern">
                                <div className="header-left">
                                    <FontAwesomeIcon icon={faBell} className="sidebar-accent-icon pulse-bell"/>
                                    <h3>Notifications</h3>
                                </div>
                            </div>
                            <div className="notification-empty-state">
                                <div className="bell-slash-icon">
                                    <FontAwesomeIcon icon={faBellSlash}/>
                                </div>
                                <p>You're all caught up!</p>
                                <span>No new notifications at this time.</span>
                            </div>
                        </section>
                    </aside>
                </main>
            </div>
        </div>
    );
}

export default UserDashboard;