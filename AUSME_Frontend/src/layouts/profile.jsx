import React, {useState, useEffect, useRef, useMemo, memo} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {motion, AnimatePresence} from 'framer-motion';
import ProfileResearchCard from '../components/user/ProfileResearchCard';
import ResearcherWorldMap from '../components/user/col_map.jsx';
import Pagination from '../components/paper/Pagination';
import ExpertiseRadarChart from '../components/user/ExpertiseRadarChart';
import ExpertiseKeywords from '../components/user/ExpertiseKeywords';
import SimilarProfilesCarousel from '../components/user/SimilarProfilesCarousel';
import PublicFooter from '../components/footer';
import {fetchResearcherProfile, updatePublicVisibility} from '../services/user';
import {updatePaperStatus} from '../services/paper';
import {getCurrentUser} from '../services/session';
import '../styles/user/profile-layout.css';
import {useTracker} from '../hooks/useTracker';

const MemoizedRadar = memo(({data}) => (
    <div className="radar-viz-container no-pad-top">
        <ExpertiseRadarChart data={data}/>
    </div>
));

const MemoizedKeywords = memo(({keywords}) => (
    <div className="no-pad-top">
        <ExpertiseKeywords keywords={keywords}/>
    </div>
));

const HorizontalIntelligence = memo(({intelTab, setIntelTab, radarData, keywordData}) => (
    <div className="intelligence-box">
        <div className="intel-header">
            <span className="mini-title">Intelligence</span>
            <div className="intel-toggle">
                <button className={intelTab === 'radar' ? 'active' : ''} onClick={() => setIntelTab('radar')}>Radar
                </button>
                <button className={intelTab === 'keywords' ? 'active' : ''}
                        onClick={() => setIntelTab('keywords')}>Keywords
                </button>
            </div>
        </div>
        <div className="intel-body no-pad-top">
            <AnimatePresence mode="wait">
                <motion.div
                    key={intelTab}
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -10}}
                    transition={{duration: 0.2}}
                    style={{height: '100%', width: '100%', display: 'flex', flexDirection: 'column'}}
                >
                    {intelTab === 'radar' ? (
                        <MemoizedRadar data={radarData}/>
                    ) : (
                        <MemoizedKeywords keywords={keywordData}/>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    </div>
));

const Profile = ({viewType = 'public'}) => {
    const {auid, targetAuid} = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {trackEvent} = useTracker();

    const [activeSection, setActiveSection] = useState('profile-card');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1100);
    const [itemsPerPage, setItemsPerPage] = useState(2);
    const [layoutMode, setLayoutMode] = useState(window.innerWidth > 1100 ? 'horizontal' : 'vertical');
    const [intelTab, setIntelTab] = useState('radar');

    const currentUser = viewType === 'public' ? null : getCurrentUser();

    const isInspectMode = viewType === 'inspect' && !!targetAuid;
    const isProfileOwner = (viewType === 'private' || isInspectMode) && (
        currentUser?.auid?.toLowerCase() === auid?.toLowerCase() ||
        (isInspectMode && targetAuid?.toLowerCase() === auid?.toLowerCase())
    );

    const {data: profileData, isLoading, isError} = useQuery({
        queryKey: ['profile', auid, viewType, targetAuid],
        queryFn: () => fetchResearcherProfile(auid, viewType, targetAuid),
        enabled: !!auid,
        staleTime: isProfileOwner ? 1000 * 60 * 5 : 0,
        gcTime: isProfileOwner ? 1000 * 60 * 30 : 0,
    });

    const radarData = useMemo(() => profileData?.radar_data, [profileData?.radar_data]);
    const keywordData = useMemo(() => profileData?.keyword_data, [profileData?.keyword_data]);

    const paperMutation = useMutation({
        mutationFn: ({paperId, newStatus}) => updatePaperStatus(paperId, newStatus, targetAuid),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['profile', auid, viewType, targetAuid]});
        }
    });

    const visibilityMutation = useMutation({
        mutationFn: ({newStatus}) => updatePublicVisibility(auid, newStatus, targetAuid),
        onSuccess: (data) => {
            queryClient.setQueryData(['profile', auid, viewType, targetAuid], (oldData) => {
                if (!oldData) return oldData;
                return {...oldData, public_status: data.public_status};
            });
        }
    });

    const sectionRefs = {
        'profile-card': useRef(null),
        'research-map': useRef(null),
        'publications-list': useRef(null),
        'research-focus': useRef(null),
        'top-keywords': useRef(null),
        'similar-researchers': useRef(null),
    };

    useEffect(() => {
        const handleLayoutCheck = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            setIsMobile(width <= 768);
            setIsSmallScreen(width <= 1100);

            if (height > 1250) {
                setItemsPerPage(4);
            } else if (height > 1000) {
                setItemsPerPage(3);
            } else if (height < 750) {
                setItemsPerPage(1);
            } else {
                setItemsPerPage(2);
            }

            if (width <= 1100) {
                setLayoutMode('vertical');
            }
        };

        handleLayoutCheck();
        window.addEventListener('resize', handleLayoutCheck);
        return () => window.removeEventListener('resize', handleLayoutCheck);
    }, []);

    useEffect(() => {
        if (isLoading || !profileData || layoutMode === 'horizontal') return;
        const observerOptions = {root: null, rootMargin: '-15% 0px -70% 0px', threshold: 0.1};
        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) setActiveSection(entry.target.id);
            });
        };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        Object.values(sectionRefs).forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });
        return () => observer.disconnect();
    }, [isLoading, profileData, layoutMode]);

    const handlePaperStatusToggle = async (paperId, newStatus) => {
        if (viewType !== 'private' && viewType !== 'inspect') return;
        return paperMutation.mutateAsync({paperId, newStatus});
    };

    const handlePublicVisibilityToggle = (newStatus) => {
        visibilityMutation.mutate({newStatus});
    };

    const handleNavClick = (id) => {
        const element = sectionRefs[id].current;
        if (element) {
            const offset = isMobile ? 80 : 120;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            window.scrollTo({top: elementRect - bodyRect - offset, behavior: 'smooth'});
        }
    };

    const handleProfileClick = (newAuid) => {
        let basePath = '/public/profile/';
        if (isInspectMode) {
            basePath = `/internal/inspect/dashboard/${targetAuid}/profile/`;
        } else if (viewType === 'private') {
            basePath = `/internal/dashboard/profile/`;
        }

        trackEvent('click', 'researcher', null, newAuid, `${basePath}${newAuid}`);
        navigate(`${basePath}${newAuid}`);
        window.scrollTo(0, 0);
    };

    if (isLoading) return <div className="profile-loader-container">
        <div className="spinner"></div>
        <p>Analyzing Research Intelligence...</p></div>;
    if (isError) return <div className="profile-error">Failed to load profile.</div>;

    const renderVertical = () => (
        <motion.div
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: 20}}
            className="profile-modern-wrapper"
        >
            <div className="profile-sticky-nav">
                <div className="nav-inner">
                    <div className="nav-links-wrap">
                        {[
                            {id: 'profile-card', label: 'Identity', icon: 'fa-user-circle'},
                            {id: 'research-map', label: 'Map', icon: 'fa-globe-americas'},
                            {id: 'publications-list', label: 'Papers', icon: 'fa-book'},
                            {id: 'research-focus', label: 'Radar', icon: 'fa-dharmachakra'},
                            {id: 'top-keywords', label: 'Keywords', icon: 'fa-tags'},
                            {id: 'similar-researchers', label: 'Network', icon: 'fa-project-diagram'},
                        ].map(item => (
                            <button key={item.id} className={`nav-anchor ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => handleNavClick(item.id)}>
                                <i className={`fas ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {isProfileOwner && !isSmallScreen && (
                        <div className="nav-actions-wrap">
                            <button className="finish-edit-btn" onClick={() => setLayoutMode('horizontal')}>
                                <i className="fas fa-check-circle"></i>
                                <span>Finish Editing</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <main className="profile-content-stack">
                <ModernSection id="profile-card" title="Researcher Identity" subtitle="Profile Metrics"
                               innerRef={sectionRefs['profile-card']}>
                    <div className="full-width-comp">
                        <ProfileResearchCard
                            profile={{
                                ...profileData.employee, ...profileData.google_scholar,
                                public_status: profileData.public_status
                            }}
                            layout={isMobile ? "vertical" : "horizontal"}
                            isEditable={isProfileOwner}
                            onVisibilityToggle={handlePublicVisibilityToggle}
                            isUpdating={visibilityMutation.isPending}
                        />
                    </div>
                </ModernSection>

                <ModernSection id="publications-list" title="Research Publications" subtitle="Academic Output"
                               innerRef={sectionRefs['publications-list']}>
                    <Pagination
                        papers={profileData.publications}
                        isVertical={true}
                        isEditable={isProfileOwner}
                        onStatusToggle={handlePaperStatusToggle}
                        itemsPerPage={itemsPerPage}
                        onProfileClick={handleProfileClick}
                        viewType={viewType}
                    />
                </ModernSection>

                <ModernSection id="research-focus" title="Research Radar" subtitle="Expertise Mapping"
                               innerRef={sectionRefs['research-focus']}>
                    <MemoizedRadar data={radarData}/>
                </ModernSection>

                <ModernSection id="top-keywords" title="Top Keywords" subtitle="Research Themes"
                               innerRef={sectionRefs['top-keywords']}>
                    <MemoizedKeywords keywords={keywordData}/>
                </ModernSection>

                <ModernSection id="similar-researchers" title="Peer Network" subtitle="Similar Footprints"
                               innerRef={sectionRefs['similar-researchers']}>
                    <SimilarProfilesCarousel profiles={profileData.similar_profiles}
                                             onProfileClick={handleProfileClick}/>
                </ModernSection>
                <ModernSection id="research-map" title="Global Footprint" subtitle="Collaboration Network"
                               innerRef={sectionRefs['research-map']}>
                    <div className="full-width-comp">
                        <div className="demographic-map-container">
                            <ResearcherWorldMap coauthors={profileData.coauthor_data}/>
                        </div>
                    </div>
                </ModernSection>
            </main>
        </motion.div>
    );

    const renderHorizontal = () => (
        <motion.div
            initial={{opacity: 0, scale: 0.98}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 1.02}}
            className="dashboard-layout-hz"
        >
            <div className="col-left">
                {isProfileOwner && (
                    <div className="hz-top-edit-container">
                        <button className="hz-edit-btn-top" onClick={() => setLayoutMode('vertical')}>
                            <i className="fas fa-user-edit"></i> Edit My Profile
                        </button>
                    </div>
                )}
                <div className="hz-card-frame">
                    <ProfileResearchCard
                        profile={{
                            ...profileData.employee, ...profileData.google_scholar,
                            public_status: profileData.public_status
                        }}
                        layout="vertical"
                        isEditable={false}
                        onVisibilityToggle={handlePublicVisibilityToggle}
                        isUpdating={visibilityMutation.isPending}
                    />

                    <div className="demographic-map-container" style={{marginTop: '12px'}}>
                        <div className="map-sub-header">
                            <i className="fas fa-globe-americas"></i>
                            <span>Global Footprint</span>
                        </div>
                        <ResearcherWorldMap coauthors={profileData.coauthor_data}/>
                    </div>
                </div>
            </div>

            <div className="col-middle">
                <div className="hz-main-container">
                    <div className="hz-scroll-body">
                        <Pagination
                            papers={profileData.publications}
                            isVertical={true}
                            isEditable={false}
                            onStatusToggle={handlePaperStatusToggle}
                            itemsPerPage={itemsPerPage}
                            onProfileClick={handleProfileClick}
                            viewType={viewType}
                        />
                    </div>
                </div>
            </div>

            <div className="col-right">
                <HorizontalIntelligence
                    intelTab={intelTab}
                    setIntelTab={setIntelTab}
                    radarData={radarData}
                    keywordData={keywordData}
                />
                <div className="hz-network-box">
                    <div className="hz-main-header"><span className="mini-title">Peer Network</span></div>
                    <SimilarProfilesCarousel profiles={profileData.similar_profiles}
                                             onProfileClick={handleProfileClick}/>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="profile-root">
            {isInspectMode && <div className="inspect-banner">INSPECT MODE: Impersonating {targetAuid}</div>}
            <AnimatePresence mode="wait">
                {layoutMode === 'vertical' ? renderVertical() : renderHorizontal()}
            </AnimatePresence>
            {viewType === 'public' && layoutMode === 'vertical' && <PublicFooter viewType="public"/>}
        </div>
    );
};

const ModernSection = memo(({id, title, subtitle, children, innerRef}) => (
    <section id={id} ref={innerRef} className="modern-layout-section">
        <div className="modern-section-header">
            <div className="title-block">
                <div className="accent-bar"></div>
                <div className="text-group">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </div>
        </div>
        <div className="modern-section-body">{children}</div>
    </section>
));

export default Profile;