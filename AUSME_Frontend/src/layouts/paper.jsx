import React, {useState, useEffect, useRef, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {fetchPaperCount, fetchPapers} from '../services/paper';
import {fetchColleges, researchers_lookup} from '../services/api';
import {getCollegeIcon} from '../services/icons';
import PaperCard from '../components/paper/PaperCard';
import '../styles/paper/paper-page.css';
import {useHeadshots} from "../components/HeadshotContext";
import {useTracker} from "../hooks/useTracker";
import {useLocation, useNavigate} from "react-router-dom";
import PaperDetailedModal from '../components/paper/PaperDetailModal';


function Paper({viewType = 'public'}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isInteracted, setIsInteracted] = useState(false);
    const [activeFilters, setActiveFilters] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [sortBy, setSortBy] = useState('recent');
    const [selectedPaper, setSelectedPaper] = useState(null);
    const {getMiniHeadshot} = useHeadshots();

    const searchRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const itemRefs = useRef([]);
    const hasSearchedRef = useRef(false);

    const location = useLocation();
    const navigate = useNavigate();
    const {trackEvent} = useTracker();

    const isFiltered = !!(debouncedSearch.trim() || activeFilters.length > 0 || sortBy !== 'recent');

    const {data: collegeData} = useQuery({
        queryKey: ['colleges', 'private'],
        queryFn: () => fetchColleges('private'),
        staleTime: 1000 * 60 * 60,
    });

    const {data: researcherData} = useQuery({
        queryKey: ['researchers', 'public'],
        queryFn: () => researchers_lookup('public'),
        staleTime: 1000 * 60 * 60,
    });

    const colleges = useMemo(() => collegeData ? (Array.isArray(collegeData) ? collegeData : (collegeData.results || [])) : [], [collegeData]);
    const researchers = useMemo(() => researcherData ? (Array.isArray(researcherData) ? researcherData : (researcherData.results || [])) : [], [researcherData]);

    useEffect(() => {
        const autoQuery = location.state?.autoSearchQuery;
        if (autoQuery && !hasSearchedRef.current) {
            hasSearchedRef.current = true;
            setSearchTerm(autoQuery);
            setDebouncedSearch(autoQuery);

            trackEvent('search', 'Paper Search', autoQuery, null,'/internal/dashboard/papers');

            navigate(location.pathname, {
                replace: true,
                state: {}
            });
        }
    }, [location.state, navigate, location.pathname, trackEvent]);

    useEffect(() => {
        const lastWord = searchTerm.split(" ").pop() || "";

        if (isInteracted && (lastWord.startsWith('#') || lastWord.startsWith('/'))) {
            setShowSuggestions(true);
            return;
        }

        setShowSuggestions(false);

        const handler = setTimeout(() => {
            if (searchTerm.trim() && searchTerm !== debouncedSearch) {
                trackEvent('search', 'Paper Search', searchTerm, null, '/internal/dashboard/papers');
            }
            setDebouncedSearch(searchTerm);
        }, 600);

        return () => clearTimeout(handler);
    }, [searchTerm, isInteracted, trackEvent, debouncedSearch]);

    useEffect(() => {
        if (showSuggestions && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex, showSuggestions]);

    const {filteredSuggestions, triggerMode} = useMemo(() => {
        const lastWord = searchTerm.split(" ").pop() || "";
        const query = lastWord.slice(1).toLowerCase();
        if (lastWord.startsWith('#')) {
            return {
                triggerMode: 'college',
                filteredSuggestions: colleges.filter(c => c.name.toLowerCase().includes(query))
            };
        }
        if (lastWord.startsWith('/')) {
            return {
                triggerMode: 'author', filteredSuggestions: researchers.filter(r =>
                    r?.first_name?.toLowerCase().includes(query) ||
                    r?.last_name?.toLowerCase().includes(query)
                ).slice(0, 15)
            };
        }
        return {triggerMode: null, filteredSuggestions: []};
    }, [colleges, researchers, searchTerm]);

    const handleSelect = (item) => {
        const isAuthor = triggerMode === 'author';
        const filterName = isAuthor ? `${item.first_name} ${item.last_name}` : item.name;
        const itemId = isAuthor ? item.auid : item.id;

        if (!activeFilters.find(f => f.id === itemId && f.type === triggerMode)) {
            setActiveFilters(prev => [...prev, {
                id: itemId,
                type: triggerMode,
                displayName: filterName,
                auid: isAuthor ? item.auid : null
            }]);

        }

        const words = searchTerm.split(" ");
        words.pop();
        setSearchTerm(words.join(" ").trim() + (words.length > 0 ? " " : ""));
        setShowSuggestions(false);
    };

    const filterParams = useMemo(() => activeFilters.map(f => ({type: f.type, value: f.id})), [activeFilters]);

    const {data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch} = useInfiniteQuery({
        queryKey: isFiltered ? ['papers', 'filtered'] : ['papers', 'dashboard'],
        queryFn: ({pageParam = null}) => fetchPapers({
            cursorUrl: pageParam,
            search: debouncedSearch,
            filters: filterParams,
            sort: sortBy
        }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.next || undefined,

        staleTime: isFiltered ? 0 : 1000 * 60 * 10,
        gcTime: isFiltered ? 0 : 1000 * 60 * 60,
    });

    useEffect(() => {
        if (isFiltered) {
            refetch();
        }
    }, [debouncedSearch, filterParams, sortBy, refetch, isFiltered]);

    const allPapers = useMemo(() => data?.pages.flatMap(page => page.results) || [], [data]);
    const isComputing = isLoading && (debouncedSearch !== "" || activeFilters.length > 0);
    const hasNoResults = !isLoading && allPapers.length === 0;

    const handleKeyDown = (e) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;
        if (e.key === "ArrowDown" || e.key === "Tab") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleSelect(filteredSuggestions[selectedIndex]);
        }
    };

     const { data: numPapersData, isLoading: isPaperCountLoading } = useQuery({
        queryKey: ['paper-count', filterParams],
        queryFn: () => fetchPaperCount(filterParams),
        staleTime: isFiltered ? 0 : 1000 * 60 * 10,
    });

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsInteracted(false);
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const resetSearch = () => {
        hasSearchedRef.current = false;
        setSearchTerm("");
        setDebouncedSearch("");
        setActiveFilters([]);
        setSortBy('recent');
    };

    return (
        <div className="paper-page-wrapper">
            <header className="frosted-sticky-header">
                <div className="header-search-row">
                    <div ref={searchRef}
                         className={`search-aura-container ${isInteracted ? 'interacted-formal' : 'aura-active'} ${isComputing ? 'computing-ai' : ''}`}>
                        <div className="aura-clipper">
                            <div className="color-aura-layer"></div>
                        </div>
                        <div className="search-bar-content">
                            <i className={`fas ${isComputing ? 'fa-wand-magic-sparkles fa-spin' : 'fa-search'} search-icon-dev`}></i>
                            <input
                                type="text"
                                placeholder="Search keywords, #colleges, or /researchers..."
                                value={searchTerm}
                                onFocus={() => setIsInteracted(true)}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {!showSuggestions && (
                                <div className="compact-help-pills">
                                    <span className="help-badge"># College</span>
                                    <span className="help-badge">/ Author</span>
                                </div>
                            )}

                            <div className="search-stats-pill" data-name={isLoading ? "Loading paper count..." : `Showing ${allPapers.length} out of ${numPapersData?.count ?? '...'} papers`}>
                                <span className="count-num">{isLoading ? "..." : `${allPapers.length}/${numPapersData?.count ?? '...'}`}</span>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showSuggestions && (
                                <motion.div className="command-menu-dropdown" initial={{opacity: 0, y: -5}}
                                            animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -5}}>
                                    <div className="command-scroll-container" ref={scrollAreaRef}>
                                        {filteredSuggestions.map((item, idx) => (
                                            <div key={`${triggerMode}-${item.id || item?.auid}`}
                                                 ref={el => itemRefs.current[idx] = el}
                                                 className={`command-item ${idx === selectedIndex ? 'active' : ''}`}
                                                 onClick={() => handleSelect(item)}
                                                 onMouseEnter={() => setSelectedIndex(idx)}>
                                                <div className="command-icon-box">
                                                    {triggerMode === 'college' ? (
                                                        <img src={getCollegeIcon(item.name)} alt=""
                                                             className="command-icon-img"/>
                                                    ) : (
                                                        <img src={getMiniHeadshot(item?.auid)} alt=""
                                                             className="command-icon-img headshot-circle"/>
                                                    )}
                                                </div>
                                                <span className="command-text">
                                                    {triggerMode === 'college' ? item.name : `${item.first_name} ${item.last_name}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="sort-toggle-group">
                        <button
                            className={`toggle-option ${sortBy === 'recent' ? 'active' : ''}`}
                            onClick={() => {
                                setSortBy('recent');
                            }}
                        >
                            <i className="fas fa-bolt"></i>
                            <span>Latest</span>
                        </button>
                        <button
                            className={`toggle-option ${sortBy === 'cited' ? 'active' : ''}`}
                            onClick={() => {
                                setSortBy('cited');
                            }}
                        >
                            <i className="fas fa-fire-alt"></i>
                            <span>Trending</span>
                        </button>
                        <div className={`toggle-glider ${sortBy}`}></div>
                    </div>
                </div>

                <AnimatePresence>
                    {activeFilters.length > 0 && (
                        <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}}
                                    className="filter-chips-row">
                            {activeFilters.map(f => (
                                <div key={`filter-${f.type}-${f.id}`} className="mini-filter-chip">
                                    {f.type === 'author' ? (
                                        <img src={getMiniHeadshot(f.auid)} className="chip-headshot" alt=""/>
                                    ) : (
                                        <img src={getCollegeIcon(f.displayName)} className="chip-college-icon" alt=""/>
                                    )}
                                    <span>{f.displayName}</span>
                                    <motion.div
                                        className="chip-close-wrapper"
                                        whileHover={{rotate: 90, scale: 1.2}}
                                        onClick={() => setActiveFilters(prev => prev.filter(x => x.id !== f.id))}
                                    >
                                        <i className="fas fa-times"></i>
                                    </motion.div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="paper-grid-content">
                <main className="paper-uniform-grid">
                    <AnimatePresence mode="popLayout">
                        {hasNoResults ? (
                            <motion.div
                                className="no-results-advanced-card"
                                initial={{opacity: 0, scale: 0.95}}
                                animate={{opacity: 1, scale: 1}}
                                exit={{opacity: 0}}
                            >
                                <div className="empty-icon-wrapper">
                                    <i className="fas fa-file-circle-xmark"></i>
                                    <div className="empty-pulse-ring"></div>
                                </div>
                                <h3>No Relevant Documents Found</h3>
                                <p>We couldn't find matches for your current filters. Try broader keywords or clearing
                                    specific authors/colleges.</p>
                                <button className="reset-search-btn" onClick={resetSearch}>
                                    <i className="fas fa-rotate-left"></i> Reset All Filters
                                </button>
                            </motion.div>
                        ) : (
                            allPapers.map((paper) => (
                                <motion.div className="grid-item-stretch" key={paper.id} initial={{opacity: 0}}
                                            animate={{opacity: 1}}>
                                    <PaperCard paper={paper} viewType={viewType} onOpenModal={setSelectedPaper}/>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </main>
                {hasNextPage && !hasNoResults && (
                    <button className="btn-load-more" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                        {isFetchingNextPage ? "..." : "Load More"}
                    </button>
                )}
            </div>
            <PaperDetailedModal
                paper={selectedPaper}
                isOpen={selectedPaper !== null}
                onClose={() => setSelectedPaper(null)}
                viewType={viewType}
            />
        </div>
    );
}

export default Paper;