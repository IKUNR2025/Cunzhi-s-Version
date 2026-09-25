import React, {useState, useMemo, useRef, useCallback, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {fetchColleges, fetchResearchers} from '../../services/api';
import {getCollegeIcon} from '../../services/icons';
import {motion, AnimatePresence} from 'framer-motion';
import UserList from '../user/UserList';
import ProfileModal from '../../components/user/UserCardModal';
import universityLogo from '../../assets/logo/AUSME_vertical.png';
import {useNavigate} from "react-router-dom";
import {useTracker} from "../../hooks/useTracker";
import {useHeadshots} from "../HeadshotContext";


const HighlightedText = ({text, highlight}) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
            )}
        </span>
    );
};

const ExpertDirectory = ({triggerExit, viewType = 'public'}) => {
    const [selectedCollegeId, setSelectedCollegeId] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const {getMiniHeadshot} = useHeadshots();

    const scrollContainerRef = useRef(null);
    const itemRefs = useRef([]);
    const navigate = useNavigate();
    const {trackEvent} = useTracker();


    const {data: rawColleges = [], isLoading: collegesLoading} = useQuery({
        queryKey: ['colleges', viewType],
        queryFn: () => fetchColleges(viewType),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60,
    });

    const {data: allResearchers = [], isLoading: researchersLoading, isError} = useQuery({
        queryKey: ['researchers', viewType],
        queryFn: () => fetchResearchers(viewType),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60,
    });

    const autocompleteResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return allResearchers.filter(res => {
            const first = res.employee?.first_name || "";
            const last = res.employee?.last_name || "";
            const fullName = `${first} ${last}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
        }).slice(0, 6);
    }, [searchTerm, allResearchers]);

    const isLoading = collegesLoading || researchersLoading;

    useEffect(() => {
        if (isError && triggerExit) triggerExit();
    }, [isError, triggerExit]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo(0, 0);
        }
    }, [selectedCollegeId]);

    useEffect(() => {
        if (autocompleteResults.length > 0 && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex, autocompleteResults]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm, autocompleteResults.length]);

    const processedColleges = useMemo(() => {
        if (!allResearchers.length || !rawColleges.length) return [];
        const counts = allResearchers.reduce((acc, res) => {
            const id = String(res.employee?.college_id);
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {});
        return rawColleges
            .filter(college => (counts[String(college.id)] || 0) > 0)
            .map(c => ({...c, count: counts[String(c.id)] || 0}));
    }, [rawColleges, allResearchers]);

    const formatProfileData = useCallback((res) => {
        if (!res) return null;
        return {
            faculty_id: res.employee?.auid || res.auid,
            first_name: res.employee?.first_name,
            last_name: res.employee?.last_name,
            email: res.employee?.email,
            phone: res.employee?.phone,
            title: res.employee?.title || res.title,
            department_name: res.employee?.department_name,
            college_name: res.employee?.college_name,
            faculty_top_topics: res.top_expertise || [],
            google_scholar_url: res.google_scholar_url,
            cv_url: res.employee?.cv_url,
            id: res.id,
            college_id: res.employee?.college_id
        };
    }, []);

    const handleKeyDown = (e) => {
        if (!autocompleteResults.length) return;
        if (e.key === "ArrowDown" || e.key === "Tab") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % autocompleteResults.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + autocompleteResults.length) % autocompleteResults.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleOpenProfile(autocompleteResults[selectedIndex]);
        }
    };

    const handleOpenProfile = (res) => {
        const profile = formatProfileData(res);
        setSelectedProfile(profile);
        setIsModalOpen(true);
        setIsSearchOpen(false);
        setSearchTerm('');
        setSelectedIndex(0);
    };

    const handleViewFullProfile = useCallback((auid) => {
        const basePath = viewType === 'private'
            ? '/internal/dashboard/profile'
            : '/public/profile';

        trackEvent('click', 'researcher', null, auid, 'directory_list_view_profile');

        navigate(`${basePath}/${auid}`);
    }, [navigate, trackEvent, viewType]);

    const handleCollegeChange = (id) => {
        setSelectedCollegeId(id);
    };

    const toggleSearch = () => {
        if (isSearchOpen) setSearchTerm('');
        setIsSearchOpen(!isSearchOpen);
    };

    const displayItems = useMemo(() => {
        return allResearchers
            .filter(r => selectedCollegeId === 'all' || String(r.employee?.college_id) === String(selectedCollegeId))
            .map(r => formatProfileData(r));
    }, [allResearchers, selectedCollegeId, formatProfileData]);

    return (
        <div className="expert-directory-inner-layout" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
        }}>

            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={() => setIsSearchOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(15, 23, 42, 0.3)',
                            backdropFilter: 'blur(6px)',
                            zIndex: 20
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="directory-header-block" style={{flex: '0 0 auto', zIndex: 100, position: 'relative'}}>
                <div className="floating-dock-container">
                    <div className="nav-dock">
                        <div
                            className={`dock-item ${selectedCollegeId === 'all' ? 'active' : ''}`}
                            onClick={() => handleCollegeChange('all', 'General')}
                            data-name="General"
                        >
                            <div className="dock-icon-box">
                                <img src={universityLogo} alt="Uni" className="dock-svg"/>
                                {selectedCollegeId === 'all' &&
                                    <span className="dock-badge">{allResearchers.length}</span>}
                            </div>
                        </div>

                        <div className="dock-v-divider"/>

                        <div className="dock-scroll-area">
                            {processedColleges.map((college) => (
                                <div
                                    key={college.id}
                                    className={`dock-item ${selectedCollegeId === college.id ? 'active' : ''}`}
                                    onClick={() => handleCollegeChange(college.id, college.college_name || college.name)}
                                    data-name={college.college_name || college.name}
                                >
                                    <div className="dock-icon-box">
                                        <img src={getCollegeIcon(college.college_name || college.name)}
                                             className="dock-svg" alt="college icon"/>
                                        {selectedCollegeId === college.id &&
                                            <span className="dock-badge">{college.count}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className={`dock-search-trigger ${isSearchOpen ? 'active' : ''}`}
                                onClick={toggleSearch}>
                            <i className={isSearchOpen ? "fas fa-times" : "fas fa-search-plus"}></i>
                        </button>
                    </div>

                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.div
                                initial={{opacity: 0, scale: 0.95, y: -10}}
                                animate={{opacity: 1, scale: 1, y: 15}}
                                exit={{opacity: 0, scale: 0.95, y: -10}}
                                className="dock-search-panel-absolute awesomplete"
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 1001,
                                    width: '95%',
                                    maxWidth: '600px'
                                }}
                            >
                                <div className="search-inner">
                                    <input
                                        type="text"
                                        placeholder="Find an expert..."
                                        autoFocus
                                        value={searchTerm}
                                        onKeyDown={handleKeyDown}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {autocompleteResults.length > 0 && (
                                    <ul className="autocomplete-results">
                                        {autocompleteResults.map((res, idx) => (
                                            <li key={res.id} className={`search-res-item ${idx === selectedIndex ? 'active' : ''}`}
                                                ref={el => itemRefs.current[idx] = el}
                                                onClick={() => handleOpenProfile(res)}
                                                onMouseEnter={() => setSelectedIndex(idx)}>
                                                <img src={getMiniHeadshot(res.employee?.auid)}
                                                     className="search-res-avatar" alt="avatar"/>
                                                <div className="search-res-info">
                                                    <div className="name">
                                                        <HighlightedText
                                                            text={`${res.employee?.first_name} ${res.employee?.last_name}`}
                                                            highlight={searchTerm}/>
                                                    </div>
                                                    <div
                                                        className="dept">{res.college_name || res.employee?.college_name}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="directory-adaptive-wrapper"
                style={{flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column'}}
            >
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loader"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="directory-loader"
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                minHeight: '300px'
                            }}
                        >
                            <div className="spinner"></div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            style={{width: '100%'}}
                        >
                            <UserList
                                items={displayItems}
                                itemsPerPage={8}
                                onViewProfile={handleViewFullProfile}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ProfileModal
                isOpen={isModalOpen}
                profile={selectedProfile}
                onClose={() => setIsModalOpen(false)}
                onViewProfile={handleViewFullProfile}
            />
        </div>
    );
};

export default ExpertDirectory;