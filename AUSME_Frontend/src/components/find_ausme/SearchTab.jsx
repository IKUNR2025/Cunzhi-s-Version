import React, {useState, useMemo, useCallback, useRef, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useQuery} from '@tanstack/react-query';
import {findExpertsAI} from '../../services/user.js';
import {fetchTopics} from '../../services/paper.js';
import UserList from '../user/UserList';
import {useTracker} from "../../hooks/useTracker";
import auLogo from "../../assets/logo/au.png";
import {useNavigate, useLocation} from "react-router-dom";


const layoutTransition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
    mass: 1
};


const SearchTab = ({viewType = 'public'}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const hasSearchedRef = useRef(false);

    const searchInputRef = useRef(null);
    const {trackEvent} = useTracker();

    const {
        data: dynamicTopics = [],
        isLoading: isTopicsLoading
    } = useQuery({
        queryKey: ['topics', viewType],
        queryFn: () => fetchTopics(viewType),
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
    });

    const performSearch = useCallback(async (overrideQuery) => {
        const term = overrideQuery || (selectedKeywords.length > 0 ? selectedKeywords.join(', ') : searchQuery);
        if (!term || !term.trim()) return;

        if (viewType !== 'public') {
            trackEvent('search', 'Find Expert Search', term, null, '/internal/dashboard/find_ausme');
        }

        setIsLoading(true);
        setHasSearched(true);
        setIsExpanded(false);

        try {
            const keywordsArray = term.split(',').map(k => k.trim());
            const data = await findExpertsAI(keywordsArray, viewType);
            setResults(data);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedKeywords, trackEvent, viewType]);

    useEffect(() => {
        const autoQuery = location.state?.autoSearchQuery;

        if (autoQuery && !hasSearchedRef.current) {
            hasSearchedRef.current = true;
            setSearchQuery(autoQuery);
            performSearch(autoQuery);

            navigate(location.pathname, {
                replace: true,
                state: {}
            });
        }
    }, [location.state, performSearch, navigate, location.pathname]);

    const toggleKeyword = (phrase) => {
        setSelectedKeywords(prev => {
            const newKeywords = prev.includes(phrase)
                ? prev.filter(k => k !== phrase)
                : (prev.length < 3 ? [...prev, phrase] : prev);
            return newKeywords;
        });

        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const removeKeyword = (phrase) => {
        setSelectedKeywords(prev => prev.filter(k => k !== phrase));
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const categoryElements = useMemo(() => {
        if (isTopicsLoading) return <div className="loading-topics">Analyzing Research Trends...</div>;

        return dynamicTopics.map((topic) => (
            <div key={topic.id} className="minimal-cat-card">
                <h4>{topic.topic_title}</h4>
                <div className="min-kw-list">
                    {topic.phrases.map((p) => {
                        const isSelected = selectedKeywords.includes(p.phrase);
                        return (
                            <button
                                key={p.id}
                                className={isSelected ? 'selected-topic-btn' : ''}
                                onClick={() => toggleKeyword(p.phrase)}
                            >
                                {p.phrase}
                                {isSelected &&
                                    <i className="fas fa-check" style={{marginLeft: '5px', fontSize: '10px'}}></i>}
                            </button>
                        );
                    })}
                </div>
            </div>
        ));
    }, [dynamicTopics, isTopicsLoading, selectedKeywords]);

    const handleSearchAgain = useCallback(() => {
        hasSearchedRef.current = false;
        setHasSearched(false);
        setResults([]);
        setSearchQuery("");
        setSelectedKeywords([]);
        setIsExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }, []);

    const handleFocus = useCallback(() => {
        if (!hasSearched) setIsExpanded(true);
        setIsFocused(true);
    }, [hasSearched]);


    const handleViewFullProfile = useCallback((auid) => {
        const basePath = viewType === 'private'
            ? '/internal/dashboard/profile'
            : '/public/profile';

        trackEvent('click', 'researcher', null, auid, `${basePath}/${auid}`);

        navigate(`${basePath}/${auid}`);
    }, [navigate, viewType, trackEvent]);


    return (
        <div className="search-tab-wrapper">
            <motion.div
                className={`find_expert_search_section ${hasSearched || isExpanded ? 'is-expanded' : 'is-centered'}`}
                layout
                transition={layoutTransition}
            >
                <div className="search_main_group">
                    <motion.div
                        className={`search_header_row ${hasSearched || isExpanded ? 'side-by-side' : 'stacked'}`}
                        layout
                        transition={layoutTransition}
                    >
                        <motion.div className="logo_placeholder" layout transition={layoutTransition}>
                            <img src={auLogo} alt="AU Logo"/>
                        </motion.div>

                        <motion.div
                            className={`modern-search-wrapper 
                                ${isFocused ? 'focused' : ''} 
                                ${isLoading ? 'ai-thinking' : ''} 
                                ${hasSearched ? 'input-locked' : ''}`}
                            layout
                            transition={layoutTransition}
                        >
                            <i className="fas fa-search search-icon-left"></i>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="find_expert_search-input"
                                placeholder={hasSearched ? "Viewing results..." : "Type research keywords..."}
                                value={selectedKeywords.length > 0 ? selectedKeywords.join(', ') : searchQuery}
                                disabled={hasSearched}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                                onFocus={handleFocus}
                                onBlur={() => setIsFocused(false)}
                            />

                            <AnimatePresence mode="wait">
                                {!hasSearched ? (
                                    <motion.button
                                        key="search-btn"
                                        className="modern-search-btn"
                                        onClick={() => performSearch()}
                                        initial={{opacity: 0, scale: 0.8}}
                                        animate={{opacity: 1, scale: 1}}
                                        exit={{opacity: 0, scale: 0.8}}
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                    >
                                        <span>{isLoading ? 'Searching...' : 'Search'}</span>
                                        {!isLoading && <i className="fas fa-arrow-right"></i>}
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        key="again-btn"
                                        className="modern-search-btn search-again-variant"
                                        onClick={handleSearchAgain}
                                        initial={{opacity: 0, x: 20}}
                                        animate={{opacity: 1, x: 0}}
                                        exit={{opacity: 0, x: -20}}
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                    >
                                        <span>Search Again</span>
                                        <i className="fas fa-redo-alt fa-spin-hover"></i>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>

                    {!hasSearched && (
                        <motion.div
                            className={`minimal-trigger ${isExpanded ? 'active-orange' : ''}`}
                            onClick={() => setIsExpanded(!isExpanded)}
                            layout
                        >
                            <div className="trigger-line"></div>
                            <span className="trigger-text">
                                {isTopicsLoading ? 'LOADING TOPICS...' : 'EXPLORE TOPICS'}
                            </span>
                            <motion.i
                                className={`fas ${isExpanded ? 'fa-minus' : 'fa-plus'}`}
                                animate={{rotate: isExpanded ? 180 : 0}}
                            />
                            <div className="trigger-line"></div>
                        </motion.div>
                    )}

                    <div className="interaction-area">
                        <AnimatePresence mode="wait">
                            {isExpanded && !hasSearched && (
                                <motion.div
                                    key="keywords-container"
                                    className="flex-grow-container"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                    style={{display: 'flex', flexDirection: 'column', height: '100%'}}
                                >
                                    {selectedKeywords.length > 0 && (
                                        <div className="sticky-chips-wrapper">
                                            <div className="selected-chips-container">
                                                {selectedKeywords.map(kw => (
                                                    <div key={kw} className="kw-chip">
                                                        {kw}
                                                        <i className="fas fa-times"
                                                           onClick={() => removeKeyword(kw)}></i>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="keyword-drawer">
                                        <div className="keyword-grid">
                                            {categoryElements}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {hasSearched && !isLoading && (
                                <motion.div
                                    key="results"
                                    className="search-results-outer-container flex-grow-container"
                                    initial={{opacity: 0, y: 20}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: 20}}
                                    transition={{duration: 0.4}}
                                >
                                    <UserList
                                        items={results}
                                        itemsPerPage={6}
                                        isSearchResult={true}
                                        onViewProfile={handleViewFullProfile}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SearchTab;