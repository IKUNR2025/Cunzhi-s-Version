import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {useNavigate, useParams, useOutletContext} from "react-router-dom";
import {motion, AnimatePresence} from 'framer-motion';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fetchAdminControlData, toggleResearcherStatus} from '../services/user.js';
import {getCollegeIcon} from '../services/icons';
import UserList from '../components/user/UserList';
import UserCardModal from '../components/user/UserCardModal';
import AddUserModal from '../components/user/AddUserModal';
import universityLogo from '../assets/logo/AUSME_vertical.png';
import '../styles/admin_control.css';
import {useHeadshots} from "../components/HeadshotContext";

const CollegeAdminCard = ({college, onToggle, isReadOnly}) => {
    const icon = getCollegeIcon(college.name);
    const status = college.status || 'include';
    const isIncluded = status === 'include';

    return (
        <motion.div
            layout
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className={`college-admin-card ${isIncluded ? 'status-active' : 'status-hidden excluded-member-dim'}`}
        >
            <div className="college-card-inner">
                <div className="college-card-header">
                    <img src={icon} alt="" className="college-card-logo"/>
                    <div className={`status-indicator-pill ${status}`}>
                        {status.toUpperCase() + 'D'}
                    </div>
                </div>

                <div className="college-card-body">
                    <h3 className="college-name-text">{college.name}</h3>
                    <p className="college-desc-text">
                        {isIncluded ? 'Visible to public directory.' : 'Hidden from public directory.'}
                    </p>
                </div>

                {!isReadOnly && (
                    <div className="college-card-footer">
                        <button
                            className={`admin-toggle-btn action-main-btn ${isIncluded ? 'btn-danger-outline' : 'btn-success-solid'}`}
                            onClick={() => onToggle(college.id, status)}
                        >
                            {isIncluded ? <><i className="fas fa-eye-slash"></i> Exclude</> : <><i
                                className="fas fa-eye"></i> Include</>}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const HighlightedText = ({text, highlight}) => {
    if (!text || !highlight.trim()) return <span>{text}</span>;
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

const AdminControl = ({viewType: propViewType}) => {
    const {targetAuid} = useParams();
    const context = useOutletContext();
    const viewType = propViewType || context?.viewType;
    const isInspectMode = viewType === 'inspect';

    const realUserRole = context?.realUser?.role;

    const [activeTab, setActiveTab] = useState('faculty');
    const [selectedCollegeId, setSelectedCollegeId] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const itemRefs = useRef([]);

    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {getMiniHeadshot} = useHeadshots();

    const {data, isPending, isError, error} = useQuery({
        queryKey: ['adminData', isInspectMode ? targetAuid : 'me'],
        queryFn: () => fetchAdminControlData(isInspectMode ? targetAuid : null),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: false
    });

    const canInspectOthers = data?.role === 'super_admin';

    const canPerformActions = !isInspectMode || realUserRole === 'super_admin';

    const mutation = useMutation({
        mutationFn: ({id, newStatus, targetType}) =>
            toggleResearcherStatus(id, newStatus, targetType, isInspectMode ? targetAuid : null),
        onMutate: async ({id, newStatus, targetType}) => {
            const queryKey = ['adminData', isInspectMode ? targetAuid : 'me'];
            await queryClient.cancelQueries({queryKey});
            const previousAdminData = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old) => {
                if (!old) return old;
                if (targetType === 'college') {
                    return {
                        ...old,
                        colleges_management: old.colleges_management.map(c =>
                            c.id === id ? {...c, status: newStatus} : c
                        )
                    };
                }
                return {
                    ...old,
                    members: old.members.map(m => {
                        const mId = m.employee?.auid || m.auid;
                        return mId === id ? {...m, status: newStatus} : m;
                    })
                };
            });
            return {previousAdminData};
        },
        onError: (err, variables, context) => {
            const queryKey = ['adminData', isInspectMode ? targetAuid : 'me'];
            if (context?.previousAdminData) {
                queryClient.setQueryData(queryKey, context.previousAdminData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['adminData', isInspectMode ? targetAuid : 'me']});
        }
    });

    const formatForUserCard = useCallback((m) => {
        const emp = m.employee || m;
        return {
            faculty_id: emp.auid || emp.faculty_id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            phone: emp.phone,
            title: emp.title || m.title || "Faculty Member",
            department_name: emp.department_name,
            college_name: emp.college_name || m.college_name,
            college_id: String(emp.college_id || m.college_id),
            faculty_top_topics: m.top_expertise || m.faculty_top_topics || [],
            status: m.status || 'include',
            google_scholar_url: m.google_scholar_url || "#",
            cv_url: emp.cv_url || "#"
        };
    }, []);

    const {allMembers, colleges, collegesMgmt, role} = useMemo(() => {
        if (!data?.members) return {allMembers: [], colleges: [], collegesMgmt: [], role: null};
        const formatted = data.members.map(formatForUserCard);

        const uniqueColleges = [];
        const map = new Map();
        formatted.forEach(m => {
            if (m.college_id && !map.has(m.college_id)) {
                map.set(m.college_id, true);
                const count = formatted.filter(x => x.college_id === m.college_id).length;
                uniqueColleges.push({id: m.college_id, name: m.college_name, count});
            }
        });

        return {
            allMembers: formatted,
            colleges: uniqueColleges,
            collegesMgmt: data.colleges_management || [],
            role: data.role
        };
    }, [data, formatForUserCard]);

    const autocompleteResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    return allMembers
        .filter(res =>
            `${res.first_name} ${res.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 6);
}, [searchTerm, allMembers]);

    const handleStatusToggle = useCallback((id, currentStatus, targetType = 'researcher') => {
        if (!canPerformActions) return;
        const newStatus = currentStatus === 'include' ? 'exclude' : 'include';
        mutation.mutate({id, newStatus, targetType});
        if (targetType === 'researcher' && selectedProfile?.faculty_id === id) {
            setSelectedProfile(prev => ({...prev, status: newStatus}));
        }
    }, [mutation, selectedProfile, canPerformActions]);

    const handleOpenSearchResult = (res) => {
        setSelectedProfile(res);
        setIsModalOpen(true);
        setIsSearchOpen(false);
        setSearchTerm('');
        setSelectedIndex(0);
    };

    const handleSearchKeyDown = (e) => {
        if (!autocompleteResults.length) return;

        if (e.key === "ArrowDown" || e.key === "Tab") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % autocompleteResults.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + autocompleteResults.length) % autocompleteResults.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleOpenSearchResult(autocompleteResults[selectedIndex]);
        }
    };

    const handleViewProfile = useCallback((auid) => {
        if (!canInspectOthers) return;
        window.open(`/internal/inspect/dashboard/${auid}`, '_blank', 'noopener,noreferrer');
    }, [canInspectOthers]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm, autocompleteResults.length]);

    useEffect(() => {
        if (autocompleteResults.length > 0 && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex, autocompleteResults]);

    if (isError) {
        return (
            <div className="admin-mode-layout"
                 style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <i className="fas fa-exclamation-triangle"
                       style={{fontSize: '40px', color: '#ef4444', marginBottom: '20px'}}></i>
                    <h2>Access Denied</h2>
                    <p>{error?.message || "This user does not have administrative permissions."}</p>
                    <button className="btn-success-solid" style={{marginTop: '20px', padding: '10px 20px'}}
                            onClick={() => navigate(-1)}>Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-mode-layout">
            {isInspectMode && (
                <div style={{
                    background: '#6366f1',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    fontWeight: '600'
                }}>
                    <i className="fas fa-eye" style={{marginRight: '8px'}}></i>
                    INSPECT MODE: Seeing what {targetAuid} ({role}) sees.
                </div>
            )}

            <div className="admin-tab-header">
                <div className="tab-pill-box">
                    <button className={`tab-pill ${activeTab === 'faculty' ? 'active' : ''}`}
                            onClick={() => setActiveTab('faculty')}>
                        <i className="fas fa-microscope"></i> Researchers Management
                    </button>
                    {role === 'super_admin' && (
                        <button className={`tab-pill ${activeTab === 'colleges' ? 'active' : ''}`}
                                onClick={() => setActiveTab('colleges')}>
                            <i className="fas fa-university"></i> College Access
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                                onClick={() => setIsSearchOpen(false)}
                                className="search-overlay-blur"
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    background: 'rgba(15, 23, 42, 0.3)',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 100
                                }}
                    />
                )}
            </AnimatePresence>

            {activeTab === 'faculty' ? (
                <>
                    <div className="directory-header-block">
                        <div className="floating-dock-container">
                            <div className="nav-dock">
                                <div className={`dock-item ${selectedCollegeId === 'all' ? 'active' : ''}`}
                                     onClick={() => setSelectedCollegeId('all')} data-name="All Colleges">
                                    <div className="dock-icon-box">
                                        <img src={universityLogo} alt="Uni" className="dock-svg"/>
                                        {selectedCollegeId === 'all' &&
                                            <span className="dock-badge">{allMembers.length}</span>}
                                    </div>
                                </div>
                                <div className="dock-v-divider"/>
                                <div className="dock-scroll-area">
                                    {colleges.map((c) => (
                                        <div key={c.id}
                                             className={`dock-item ${selectedCollegeId === c.id ? 'active' : ''}`}
                                             onClick={() => setSelectedCollegeId(c.id)} data-name={c.name}>
                                            <div className="dock-icon-box">
                                                <img src={getCollegeIcon(c.name)} className="dock-svg" alt="icon"/>
                                                {selectedCollegeId === c.id &&
                                                    <span className="dock-badge">{c.count}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className={`dock-search-trigger ${isSearchOpen ? 'active' : ''}`}
                                        onClick={() => setIsSearchOpen(!isSearchOpen)} data-name="Search">
                                    <i className={isSearchOpen ? "fas fa-times" : "fas fa-search-plus"}></i>
                                </button>
                                {!isInspectMode && (
                                    <button className="dock-search-trigger add-person-trigger"
                                            onClick={() => setIsAddUserModalOpen(true)} data-name="Add Person"
                                            style={{marginLeft: '10px'}}>
                                        <i className="fas fa-user-plus"></i>
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {isSearchOpen && (
                                    <motion.div initial={{opacity: 0, scale: 0.95, y: -10}}
                                                animate={{opacity: 1, scale: 1, y: 15}}
                                                exit={{opacity: 0, scale: 0.95, y: -10}}
                                                className="dock-search-panel-absolute awesomplete">
                                        <div className="search-inner">
                                            <input type="text" placeholder="Search faculty..." autoFocus onKeyDown={handleSearchKeyDown}
                                                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                                        </div>
                                       {autocompleteResults.length > 0 && (
                                            <ul className="autocomplete-results">
                                                {autocompleteResults.map((res, idx) => (
                                                    <li
                                                        key={res.faculty_id}
                                                        ref={el => itemRefs.current[idx] = el}
                                                        className={`search-res-item ${idx === selectedIndex ? 'active' : ''}`}
                                                        onClick={() => handleOpenSearchResult(res)}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                    >
                                                        <img
                                                            src={getMiniHeadshot(res.faculty_id)}
                                                            className="search-res-avatar"
                                                            alt="avatar"
                                                        />
                                                        <div className="search-res-info">
                                                            <div className="name">
                                                                <HighlightedText
                                                                    text={`${res.first_name} ${res.last_name}`}
                                                                    highlight={searchTerm}
                                                                />
                                                            </div>
                                                            <div className="dept">{res.college_name}</div>
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
                    <div ref={scrollContainerRef} className="directory-adaptive-wrapper" style={{padding: '20px'}}>
                        <UserList
                            items={allMembers.filter(r => selectedCollegeId === 'all' || r.college_id === String(selectedCollegeId))}
                            isAdminMode={true}
                            onToggleStatus={(id, status) => handleStatusToggle(id, status, 'researcher')}
                            canInspect={canInspectOthers}
                            onViewProfile={handleViewProfile}
                            isReadOnly={!canPerformActions}/>
                    </div>
                </>
            ) : (
                <div className="directory-adaptive-wrapper college-grid-padding">
                    <div className="college-management-grid">
                        {collegesMgmt.map(college => (
                            <CollegeAdminCard
                                key={college.id}
                                college={college}
                                isReadOnly={!canPerformActions}
                                onToggle={(id, status) => handleStatusToggle(id, status, 'college')}/>
                        ))}
                    </div>
                </div>
            )}

            <UserCardModal isOpen={isModalOpen} profile={selectedProfile} onClose={() => setIsModalOpen(false)}
                           isAdminMode={true}
                           onToggleStatus={(id, status) => handleStatusToggle(id, status, 'researcher')}
                           canInspect={canInspectOthers}
                           onViewProfile={handleViewProfile}
                           isReadOnly={!canPerformActions}/>

            <AddUserModal isOpen={isAddUserModalOpen} onClose={() => {
                setIsAddUserModalOpen(false);
                queryClient.invalidateQueries({queryKey: ['adminData', isInspectMode ? targetAuid : 'me']});
            }}/>
        </div>
    );
};

export default AdminControl;