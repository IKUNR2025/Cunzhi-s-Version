import React, {useState, useMemo, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import PaperCard from './PaperCard';
import '../../styles/paper/pagination.css';
import PaperDetailedModal from "./PaperDetailModal.jsx";

const Pagination = ({papers = [], itemsPerPage = 2, isEditable, onStatusToggle, viewType}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [transitionClass, setTransitionClass] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent');

    const processedPapers = useMemo(() => {
        let results = papers.filter(paper => {
            const isNotDeleted = paper.status !== 'delete';
            const matchesSearch = (paper.title || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            return isNotDeleted && matchesSearch;
        });

        results.sort((a, b) => {
            if (sortBy === 'recent') {
                const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
                const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
                return dateB - dateA;
            } else {
                const citeA = parseInt(a.total_citations || 0);
                const citeB = parseInt(b.total_citations || 0);
                return citeB - citeA;
            }
        });
        return results;
    }, [papers, searchTerm, sortBy]);

    const totalPages = Math.ceil(processedPapers.length / itemsPerPage);
    const currentPage = Math.floor(currentIndex / itemsPerPage) + 1;
    const currentItems = processedPapers.slice(currentIndex, currentIndex + itemsPerPage);

    useEffect(() => {
        setCurrentIndex(0);
    }, [searchTerm, sortBy]);

    const handlePageChange = (newIndex) => {
        if (newIndex < 0 || newIndex >= processedPapers.length) return;
        setTransitionClass(newIndex > currentIndex ? 'slide-out-left' : 'slide-out-right');

        setTimeout(() => {
            setIsVisible(false);
            setCurrentIndex(newIndex);
            setTransitionClass('');
            setTimeout(() => {
                setIsVisible(true);
                setTransitionClass(newIndex > currentIndex ? 'slide-in-right' : 'slide-in-left');
                setTimeout(() => setTransitionClass(''), 600);
            }, 50);
        }, 600);
    };

    const getPaginationRange = () => {
        const delta = 1;
        const range = [];
        const rangeWithDots = [];
        let l;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) range.push(i);
        }
        for (let i of range) {
            if (l) {
                if (i - l === 2) rangeWithDots.push(l + 1);
                else if (i - l !== 1) rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            l = i;
        }
        return rangeWithDots;
    };

    return (
        <div className="pagination-master-wrapper">
            <div className="pagination-content-top">
                <div className="papers-advanced-toolbar">
                    <div className="modern-search-container">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search publications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="search-actions-wrapper">
                            <AnimatePresence>
                                {searchTerm && (
                                    <motion.button
                                        initial={{opacity: 0, scale: 0.5}}
                                        animate={{opacity: 1, scale: 1}}
                                        exit={{opacity: 0, scale: 0.5}}
                                        onClick={() => setSearchTerm('')}
                                        className="search-clear-btn"
                                    >
                                        <i className="fas fa-times-circle"></i>
                                        <span>CLEAR</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="sort-toggle-group">
                        <button
                            className={`toggle-option ${sortBy === 'recent' ? 'active' : ''}`}
                            onClick={() => setSortBy('recent')}
                        >
                            <i className="fas fa-bolt"></i>
                            <span>Latest</span>
                        </button>
                        <button
                            className={`toggle-option ${sortBy === 'cited' ? 'active' : ''}`}
                            onClick={() => setSortBy('cited')}
                        >
                            <i className="fas fa-quote-right"></i>
                            <span>Most Cited</span>
                        </button>
                        <div className={`toggle-glider ${sortBy}`}></div>
                    </div>
                </div>

                <div className="papers-view-relative-container">
                    <button
                        className="floating-nav-btn left"
                        disabled={currentIndex === 0 || processedPapers.length === 0}
                        onClick={() => handlePageChange(currentIndex - itemsPerPage)}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    <button
                        className="floating-nav-btn right"
                        disabled={currentIndex >= (totalPages - 1) * itemsPerPage || processedPapers.length === 0}
                        onClick={() => handlePageChange(currentIndex + itemsPerPage)}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>

                    <div className="papers-view-window">
                        <div className={`papers-list ${transitionClass}`}
                             style={{visibility: isVisible ? 'visible' : 'hidden'}}>
                            {currentItems.length > 0 ? (
                                currentItems.map((paper, idx) => (
                                    <PaperCard
                                        key={`${paper.id}-${currentIndex}-${idx}`}
                                        paper={paper}
                                        onOpenModal={setSelectedPaper}
                                        isVisible={isVisible}
                                        isEditable={isEditable}
                                        onStatusToggle={onStatusToggle}
                                        viewType={viewType}
                                    />
                                ))
                            ) : (
                                <div className="no-results-card">
                                    <i className="fas fa-ghost"></i>
                                    <p>No matches found for <b>"{searchTerm}"</b></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pagination-footer-section">
                {totalPages > 1 && (
                    <div className="pagination-container">
                        <div className="pagination-numbers">
                            {getPaginationRange().map((page, index) => (
                                <button
                                    key={index}
                                    className={`${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                                    disabled={page === '...'}
                                    onClick={() => page !== '...' && handlePageChange((page - 1) * itemsPerPage)}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
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
};

export default Pagination;