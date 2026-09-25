import React, {useState, useRef, useMemo, useEffect, useCallback} from 'react';
import {useQuery, useInfiniteQuery} from '@tanstack/react-query';
import {useOutletContext, useParams, useLocation, useNavigate} from 'react-router-dom';
import OpportunityCard from '../components/opportunities/OpportunityCard.jsx';
import AgencyCard from '../components/opportunities/AgencyCard.jsx';
import OpportunityDetailModal from '../components/opportunities/OpportunityDetailModal.jsx';
import {getCurrentUser} from '../services/session.js';
import '../styles/opportunities/Opportunities.css';
import {fetchOpenAgencies, fetchOpenOpportunities} from '../services/opp.js';
import {useTracker} from "../hooks/useTracker";

function Opportunities() {
    const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState(null);
    const [currentAgencyId, setCurrentAgencyId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [recommendMode, setRecommendMode] = useState(false);
    const [bookmarksMode, setBookmarksMode] = useState(false);

    const scrollContainerRef = useRef(null);
    const hasSearchedRef = useRef(false);

    const context = useOutletContext();
    const {targetAuid} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const {trackEvent} = useTracker();

    const isInspectMode = context?.viewType === 'inspect';
    const realUser = getCurrentUser();

    const effectiveAuid = isInspectMode ? targetAuid : realUser?.auid;

    const isFiltered = !!(currentAgencyId || activeSearch || recommendMode || bookmarksMode);

    const {data: agencies = []} = useQuery({
        queryKey: ['agencies'],
        queryFn: fetchOpenAgencies,
        staleTime: 1000 * 60 * 30,
    });


    const {
        data: oppsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: oppsLoading,
        refetch
    } = useInfiniteQuery({
        queryKey: isFiltered
            ? ['opportunities', 'filtered', effectiveAuid]
            : ['opportunities', 'dashboard', effectiveAuid],
        queryFn: (ctx) => fetchOpenOpportunities({
            ...ctx,
            filters: {
                agencyId: currentAgencyId,
                activeSearch,
                recommendMode,
                bookmarksMode,
                auid: effectiveAuid
            }
        }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.next || null,
        staleTime: isFiltered ? 0 : 1000 * 60 * 10,
        gcTime: isFiltered ? 0 : 1000 * 60 * 60,
    });

    const performSearch = useCallback((term) => {
        if (!term || !term.trim()) return;

        if (!isInspectMode) {
            trackEvent('search', 'Opportunity Search', term, null, '/internal/dashboard/opportunities');
        }

        setRecommendMode(false);
        setBookmarksMode(false);
        setActiveSearch(term);
    }, [isInspectMode, trackEvent]);

    useEffect(() => {
        const autoQuery = location.state?.autoSearchQuery;
        const autoOpp = location.state?.autoOpenOpp;

        if (autoQuery && !hasSearchedRef.current) {
            hasSearchedRef.current = true;
            setSearchQuery(autoQuery);
            performSearch(autoQuery);
        }

        if (autoOpp && !selectedOpp) {
            setSelectedOpp(autoOpp);
            navigate(location.pathname, {
                replace: true,
                state: {}
            });
        }
    }, [location.state, performSearch, navigate, location.pathname, selectedOpp]);

    useEffect(() => {
        if (isFiltered) {
            refetch();
        }
    }, [currentAgencyId, activeSearch, recommendMode, bookmarksMode, refetch, isFiltered]);

    const opportunities = useMemo(() => oppsData?.pages.flatMap(page => page.results) || [], [oppsData]);
    const displayOppCount = oppsData?.pages[0]?.count ?? 0;

    const handleSearchAction = () => {
        if (activeSearch) {
            clearSearch();
        } else if (searchQuery.trim()) {
            performSearch(searchQuery);
        }
    };

    const toggleRecommend = () => {
        const nextMode = !recommendMode;
        setRecommendMode(nextMode);
        if (nextMode) {
            setBookmarksMode(false);
            setActiveSearch('');
            setSearchQuery('');
        }
    };

    const toggleBookmarks = () => {
        const nextMode = !bookmarksMode;
        setBookmarksMode(nextMode);
        if (nextMode) {
            setRecommendMode(false);
            setActiveSearch('');
            setSearchQuery('');
        }
    };

    const handleScroll = (e) => {
        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }
    };

    const clearSearch = () => {
        hasSearchedRef.current = false;
        setSearchQuery('');
        setActiveSearch('');
    };

    const handleGlobalReset = () => {
        hasSearchedRef.current = false;
        setRecommendMode(false);
        setBookmarksMode(false);
        setActiveSearch('');
        setSearchQuery('');
        setCurrentAgencyId(null);
        setIsAgencyDropdownOpen(false);
    };

    const handleAgencySelect = (agencyId) => {
        setCurrentAgencyId(agencyId);
        setIsAgencyDropdownOpen(false);
    };

    return (
        <div className={`opportunities-page-wrapper ${isAgencyDropdownOpen ? 'lock-scroll' : ''}`}>

            {isInspectMode && (
                <div className="inspect-banner-mini" style={{
                    background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                    color: 'white',
                    padding: '8px 20px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: '600'
                }}>
                    <i className="fas fa-user-secret pulse"></i>
                    <span>INSPECTING OPPORTUNITIES FOR: <strong style={{color: '#ffd8bd'}}>{targetAuid}</strong></span>
                </div>
            )}

            <div className="minimal-toggle-bar">
                <div className="centered-command-wrapper" style={{
                    display: 'flex',
                    width: '98%',
                    maxWidth: '1600px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div className="left-block" style={{display: 'flex', gap: '15px'}}>
                        <div className="static-pill-tab">
                            <button className="minimal-btn active"
                                    style={{background: '#0c2340', color: 'white', minWidth: '160px'}}>
                                Opportunities <span className="count-badge" style={{
                                color: '#ffd8bd',
                                marginLeft: '8px'
                            }}>{displayOppCount}</span>
                            </button>
                        </div>

                        <button
                            className={`agency-interesting-trigger ${isAgencyDropdownOpen ? 'open' : ''} ${currentAgencyId ? 'filter-active' : ''}`}
                            onClick={() => setIsAgencyDropdownOpen(!isAgencyDropdownOpen)}
                        >
                            <div className="inner-flex">
                                {currentAgencyId ? (
                                    <>
                                        <i className="fas fa-filter"></i>
                                        <span>Agency Applied</span>
                                        <div className="agency-count-divider"></div>
                                        <i className="fas fa-check-circle" style={{color: 'var(--auburn-orange)'}}></i>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-building-columns"></i>
                                        <span>Agencies</span>
                                        <div className="agency-count-divider"></div>
                                        <span className="agency-numeric-badge">{agencies.length}</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="center-block"
                         style={{flex: 1, display: 'flex', justifyContent: 'center', margin: '0 30px'}}>
                        <div className="vector-search-container" style={{width: '100%', maxWidth: '500px'}}>
                            <div className={`executive-search-box ${activeSearch ? 'active-mode' : ''}`}>
                                <div className="ai-icon-prefix"><i className="fas fa-search"></i></div>
                                <input
                                    type="text"
                                    className="formal-search-input"
                                    placeholder="Search by topic..."
                                    value={searchQuery}
                                    disabled={!!activeSearch}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAction()}
                                />
                                <button className="search-action-btn" onClick={handleSearchAction}>
                                    {activeSearch ? <i className="fas fa-times"></i> : "Search"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="right-block" style={{display: 'flex', gap: '10px'}}>
                        <button className={`ai-pulse-pill ${recommendMode ? 'active' : ''}`} onClick={toggleRecommend}>
                            <div className="pulse-ring"></div>
                            <i className="fas fa-sparkles"></i>
                            <span>{isInspectMode ? "Target Matches" : "AI Recommended"}</span>
                        </button>
                        <button className={`fav-pill ${bookmarksMode ? 'active' : ''}`} onClick={toggleBookmarks}>
                            <i className={`fas fa-bookmark`}></i>
                            <span>{isInspectMode ? "Target Bookmarks" : "Bookmarks"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {isAgencyDropdownOpen && (
                <div className="agency-glass-overlay" onClick={() => setIsAgencyDropdownOpen(false)}>
                    <div className="floating-agency-panel" onClick={e => e.stopPropagation()}>
                        <div className="panel-header-premium">
                            <div className="header-title-wrapper">
                                <h3 className="premium-panel-title">AGENCY HUB</h3>
                                <div className="title-underline"></div>
                            </div>
                            <button className="premium-close-btn" onClick={() => setIsAgencyDropdownOpen(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="panel-grid-container">
                            <div className="agency-grid">
                                {agencies.map(agency => (
                                    <AgencyCard
                                        key={agency.id}
                                        agency={agency}
                                        onViewOpportunities={() => handleAgencySelect(agency.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`scroll-viewport ${isAgencyDropdownOpen ? 'blurred' : ''}`} ref={scrollContainerRef}
                 onScroll={handleScroll}>
                {(currentAgencyId || activeSearch || recommendMode || bookmarksMode) && (
                    <div className="filter-context-banner reveal-animation">
                        <div className="context-label">ACTIVE FILTERS:</div>
                        <div className="context-chips-scroll">
                            {currentAgencyId && (
                                <div className="context-chip agency-chip">
                                    <i className="fas fa-building-columns"></i>
                                    {agencies.find(a => a.id === currentAgencyId)?.name}
                                </div>
                            )}
                            {bookmarksMode &&
                                <div className="context-chip fav-chip"><i className="fas fa-bookmark"></i> Bookmarks
                                </div>}
                            {recommendMode &&
                                <div className="context-chip ai-chip"><i className="fas fa-robot"></i> Matches</div>}
                            {activeSearch && <div className="context-chip search-chip"><i
                                className="fas fa-quote-left"></i> {activeSearch}</div>}
                            <button className="global-reset-ghost-btn" onClick={handleGlobalReset}>
                                <i className="fas fa-rotate-left"></i> Reset
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid-layout">
                    <div className="opportunity-grid">
                        {opportunities.length > 0 ? (
                            opportunities.map((opp, index) => (
                                <OpportunityCard
                                    key={opp.opp_id}
                                    opportunity={opp}
                                    index={index % 20}
                                    onReadMore={setSelectedOpp}
                                    bookmarksMode={bookmarksMode}
                                    effectiveAuid={effectiveAuid}
                                    formTeamBtn={true}
                                />
                            ))
                        ) : !oppsLoading && (
                            <div className="no-match-container">
                                <div className="no-match-content">
                                    <i className={bookmarksMode ? "fas fa-bookmark" : "fas fa-search-location"}></i>
                                    <h3>No results found</h3>
                                    <button className="global-reset-ghost-btn" onClick={handleGlobalReset}>Reset
                                        Filters
                                    </button>
                                </div>
                            </div>
                        )}
                        {(oppsLoading || isFetchingNextPage) && (
                            <div className="infinite-scroll-trigger">
                                <div className="dot-loader"></div>
                                <span>Loading Content...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedOpp && (
                <OpportunityDetailModal
                    opportunity={selectedOpp}
                    onClose={() => setSelectedOpp(null)}
                    effectiveAuid={effectiveAuid}
                    bookmarksMode={bookmarksMode}
                    onLocalOppPatch={(patch) =>
                        setSelectedOpp(prev => (prev ? { ...prev, ...patch } : prev))
                    }
                />
            )}
        </div>
    );
}

export default Opportunities;