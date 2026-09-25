import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useHeadshots } from '../HeadshotContext';
import { useTracker } from '../../hooks/useTracker';
import { CitationChart } from './PaperCard.jsx';
import '../../styles/paper/paper-detailed-modal.css';
import {fetchPaperDescription} from "../../services/paper.js";
import {useQuery} from "@tanstack/react-query";

const PaperDetailedModal = ({
    paper,
    isOpen,
    onClose,
    viewType = 'public',
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();
    const { getMiniHeadshot } = useHeadshots();
    const { trackEvent } = useTracker();

    const safeKeywords = Array.isArray(paper?.keywords) ? paper.keywords : [];
    const keywordList = safeKeywords
        .map((k) => (typeof k === 'string' ? k : (k.keyword || k.name || '')))
        .filter(Boolean);

    const researchers = Array.isArray(paper?.researchers) ? paper.researchers : [];
    const authorsText = Array.isArray(paper?.authors) ? paper.authors.join(', ') : (paper?.authors || 'Not provided');

    //This is for when we finally get the urls and doi, probably going to have to update style
    const paperLinks = [
        { label: 'DOI', value: paper?.doi, icon: 'fa-link' },
        // { label: 'Paper URL', value: paper?.url || paper?.paper_url, icon: 'fa-up-right-from-square' },
        { label: 'PDF', value: paper?.pdf_url, icon: 'fa-file-pdf' },
        // { label: 'Google Scholar', value: paper?.google_scholar_url, icon: 'fa-graduation-cap' },
    ].filter((x) => !!x.value);

    const formatDate = (value) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleViewProfile = (auid) => {
        const basePath =
            viewType === 'private' ? '/internal/dashboard/profile' : '/public/profile';

        trackEvent('click', 'researcher', null, auid, `${basePath}/${auid}`);
        navigate(`${basePath}/${auid}`);
    };

     const {data: descriptionData} = useQuery({
            queryKey: ['paper-description', paper?.id],
            queryFn: () => fetchPaperDescription(paper.id),
            staleTime: 1000 * 60 * 60,
        });
     const description = descriptionData?.description;

    const close = (e) => e.stopPropagation();

    return (
        <AnimatePresence>
            {isOpen && paper && (
                <div className="paper-modal-overlay" onClick={onClose}>
                    <motion.div
                        className="paper-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />

                    <motion.div
                        className="paper-modal"
                        onClick={close}
                        initial={{ scale: 0.97, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.97, opacity: 0, y: 10 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* Header */}
                        <div className="paper-modal-header">
                            {/*<div className="paper-modal-header-icon">*/}
                            {/*    <i className="fas fa-file-lines"></i>*/}
                            {/*</div>*/}

                            <div className="paper-modal-header-main">
                                <h2 className="paper-modal-title">
                                    {paper.title || 'Untitled Paper'}
                                </h2>

                                <div className="paper-modal-subtitle-row">
                                    {paper.publication_date && (
                                        <span className="paper-meta-item" data-tooltip="Publication Date">
                                            <i className="fas fa-calendar" aria-hidden="true"></i>
                                            {formatDate(paper.publication_date)}
                                        </span>
                                    )}

                                    <span className="paper-meta-item" data-tooltip="Total Citations">
                                        <i className="fas fa-quote-right" aria-hidden="true"></i>
                                        {paper.total_citations ?? 0} citations
                                    </span>

                                    {paper.publisher && (
                                        <span className="paper-meta-item" data-tooltip="Publisher">
                                            <i className="fas fa-building" aria-hidden="true"></i>
                                            {paper.publisher}
                                        </span>
                                    )}

                                    {paper.published_in && (
                                        <span className="paper-meta-item" data-tooltip="Published In">
                                            <i className="fas fa-book-open" aria-hidden="true"></i>
                                            {paper.published_in}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                className="paper-modal-close-btn"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="paper-modal-body">
                            {/* Tabs */}
                            <div className="paper-modal-tabs">
                                {['overview','Details'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`paper-modal-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="paper-modal-content-grid">
                                {activeTab === 'overview' && (
                                    <>
                                        <SectionCard title="Description">
                                            {description ? (
                                                <p className="paper-abstract-text">{description}</p>
                                            ) : (
                                                <p className="paper-muted-text">No description provided.</p>
                                            )}
                                        </SectionCard>

                                        <SectionCard title="Keywords">
                                            {keywordList.length > 0 ? (
                                                <div className="paper-keyword-wrap">
                                                    {keywordList.map((kw, idx) => (
                                                        <span key={`${kw}-${idx}`} className="paper-keyword-pill">
                                                            #{kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="paper-muted-text">No keywords available.</p>
                                            )}
                                        </SectionCard>

                                        {paperLinks.length > 0 && (
                                            <SectionCard title="Links">
                                                <div className="paper-links-list">
                                                    {paperLinks.map((link) => (
                                                        <a
                                                            key={link.label}
                                                            href={link.value}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="paper-link-row"
                                                        >
                                                            <span>
                                                                <i className={`fas ${link.icon}`}></i>
                                                                {link.label}
                                                            </span>
                                                            <i className="fas fa-arrow-up-right-from-square"></i>
                                                        </a>
                                                    ))}
                                                </div>
                                            </SectionCard>
                                        )}
                                    </>
                                )}

                                {activeTab === 'Details' && (
                                    <>
                                        <SectionCard title="Author List">
                                            <p className="paper-author-list">{authorsText}</p>
                                        </SectionCard>

                                        <SectionCard title="Linked AUSME Researchers">
                                            {researchers.length > 0 ? (
                                                <div className="paper-researcher-chip-wrap">
                                                    {researchers.map((r) => (
                                                        <button
                                                            key={r.auid}
                                                            onClick={() => handleViewProfile(r.auid)}
                                                            className="paper-researcher-chip"
                                                        >
                                                            <img
                                                                src={getMiniHeadshot(r.auid)}
                                                                alt={r.name || r.auid}
                                                                className="paper-researcher-avatar"
                                                            />
                                                            <span>{r.name || r.auid}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="paper-muted-text">No linked researchers for this paper.</p>
                                            )}
                                        </SectionCard>
                                        {paper?.total_citations !== 0 && (
                                            <SectionCard title="Citation History by Year">
                                                <CitationChart rawData={paper?.citation_per_year} isVisible={true}/>
                                            </SectionCard>
                                            )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// The styled boxes
const SectionCard = ({ title, children }) => (
    <div className="paper-section-card">
        <h4 className="paper-section-title">{title}</h4>
        {children}
    </div>
);

export default PaperDetailedModal;