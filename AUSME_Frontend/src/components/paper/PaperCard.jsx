import React, {useEffect, useRef, useState, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import * as d3 from 'd3';
import {useTracker} from "../../hooks/useTracker";
import '../../styles/paper/paper-card.css';
import {useHeadshots} from "../HeadshotContext";


export const CitationChart = ({rawData, isVisible}) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);

    const data = useMemo(() => {
        let parsed = rawData;
        if (typeof rawData === 'string') {
            try {
                parsed = JSON.parse(rawData);
            } catch (e) {
                return [];
            }
        }
        if (Array.isArray(parsed)) {
            return parsed.map(d => ({
                year: d.year.toString(),
                count: Number(d.citations || d.count || 0)
            })).sort((a, b) => a.year - b.year);
        }
        return [];
    }, [rawData]);

    useEffect(() => {
        if (data.length === 0 || !isVisible || !containerRef.current) return;
        const svg = d3.select(svgRef.current);
        const tooltip = d3.select(tooltipRef.current);
        svg.selectAll("*").remove();

        const {width, height} = containerRef.current.getBoundingClientRect();
        const margin = {top: 5, right: 5, bottom: 15, left: 5};
        const maxVal = d3.max(data, d => d.count) || 0;

        const x = d3.scaleBand().domain(data.map(d => d.year)).range([margin.left, width - margin.right]).padding(0.2);
        const y = d3.scaleLinear().domain([0, Math.max(1, maxVal * 1.1)]).range([height - margin.bottom, margin.top]);

        svg.attr("viewBox", `0 0 ${width} ${height}`);

        svg.append("g")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => x(d.year))
            .attr("width", x.bandwidth())
            .attr("fill", "#0C2340")
            .attr("y", height - margin.bottom)
            .attr("height", 0)
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.count}</strong> citations in ${d.year}`);
                d3.select(event.currentTarget).attr("fill", "#E87722"); // Highlight color
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.offsetX + 10) + "px")
                    .style("top", (event.offsetY - 25) + "px");
            })
            .on("mouseleave", (event) => {
                tooltip.style("opacity", 0);
                d3.select(event.currentTarget).attr("fill", "#0C2340");
            })
            .transition().duration(800)
            .attr("y", d => y(d.count))
            .attr("height", d => Math.max(0, (height - margin.bottom) - y(d.count)));

        svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickValues([data[0].year, data[data.length - 1].year]).tickSize(0).tickPadding(5))
            .style("font-size", "8px").style("color", "#94a3b8");
    }, [data, isVisible]);

    return (
        <div ref={containerRef} className="inline-chart-container" style={{position: 'relative'}}>
            <div ref={tooltipRef} className="citation-tooltip"
                 style={{position: 'absolute', pointerEvents: 'none', opacity: 0}}></div>
            {data.length > 0 ? <svg ref={svgRef} style={{width: '100%', height: '100%'}}></svg> : null}
        </div>
    );
};

const PaperCard = ({paper, onGenerateSummary, onOpenModal, isEditable, onStatusToggle, viewType = 'public'}) => {
    const navigate = useNavigate();
    const {trackEvent} = useTracker();
    const [isVisible, setIsVisible] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const cardRef = useRef(null);

    const {getMiniHeadshot} = useHeadshots();

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setIsVisible(true);
                obs.unobserve(e.target);
            }
        }, {threshold: 0.1});
        if (cardRef.current) obs.observe(cardRef.current);
        return () => obs.disconnect();
    }, []);

    const handleViewFullProfile = (auid) => {
        const basePath = viewType === 'private' ? '/internal/dashboard/profile' : '/public/profile';

        trackEvent('click', 'researcher', null, auid, `${basePath}/${auid}`);

        navigate(`${basePath}/${auid}`);
    };

    const handleOpenDetails = () => {
        onOpenModal(paper);
    };

    const handleSummaryRequest = () => {
        onGenerateSummary(paper);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);

        try {
            await onStatusToggle(paper.id, 'delete');
        } catch (error) {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            alert("Deletion failed. Please try again.");
        }
    };

    const isExcluded = paper.status === 'exclude';

    const authorLine = useMemo(() => {
        const rawAuthors = paper.authors || paper.researchers;
        let text = Array.isArray(rawAuthors) ? rawAuthors.join(", ") : (rawAuthors || "Collaborative Research");

        const charLimit = 125;
        if (text.length > charLimit) {
            return text.substring(0, charLimit) + "...";
        }
        return text;
    }, [paper.authors, paper.researchers]);

    return (
        <div
            ref={cardRef}
            className={`paper-card-formal ${isVisible ? 'animate-in' : 'hidden'} ${isExcluded ? 'status-excluded' : ''}`}
        >
            {isEditable && (
                <div className="compact-visibility-toggle">
                    <i className={`fas ${isExcluded ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    <label className="ios-switch">
                        <input
                            type="checkbox"
                            disabled={isDeleting}
                            checked={!isExcluded}
                            onChange={() => onStatusToggle(paper.id, isExcluded ? 'include' : 'exclude')}
                        />
                        <span className="ios-slider"></span>
                    </label>
                </div>
            )}

            <div className="paper-header" onClick={handleOpenDetails}>
                <h3 className="paper-title" onClick={handleOpenDetails}>{paper.title}</h3>
                <div className="authors-text">By {authorLine}</div>
            </div>

            <div className="metadata-strip-formal" onClick={handleOpenDetails}>
                {paper.publication_date && <span> {paper.publication_date}</span>}
                {paper.published_in && <span> {paper.published_in}</span>}
                {paper.publisher && <span> {paper.publisher}</span>}
                {paper.paper_type && <span> {paper.paper_type}</span>}
            </div>

            {paper.keywords && paper.keywords.length > 0 && (
                <div className="keywords-flex" onClick={handleOpenDetails}>
                    {paper.keywords.map((item, idx) => (
                        <span key={idx} className="formal-tag">
                            {item.keyword}
                        </span>
                    ))}
                </div>
            )}

            <div className="analytics-horizontal-box">
                <div className="total-citations-side">
                    <span className="section-label-mini">Citations</span>
                    <span className="total-count-display">{paper.total_citations}</span>
                </div>
                <div className="chart-side">
                    <CitationChart rawData={paper.citation_per_year} isVisible={isVisible}/>
                </div>
            </div>

            {paper.description && (
                <div className="abstract-formal-box">
                    <span className="abstract-badge">Abstract</span>
                    <p className="abstract-content-text">{paper.description}</p>
                </div>
            )}

            <div className="paper-footer-row">
                <div className="paper-card-actions">
                    <AnimatePresence mode="wait">
                        {isEditable && !showDeleteConfirm && (
                            <motion.button
                                key="del-btn"
                                initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                                className="btn-danger-formal"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <i className="fas fa-trash-alt"></i> Remove
                            </motion.button>
                        )}

                        {isEditable && showDeleteConfirm && (
                            <motion.div
                                key="confirm-ui"
                                initial={{scale: 0.9, opacity: 0}}
                                animate={{scale: 1, opacity: 1}}
                                exit={{scale: 0.9, opacity: 0}}
                                className="advanced-delete-confirm"
                            >
                                <span className="warning-text">Cannot be undone!</span>
                                <button
                                    className="confirm-btn"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <i className="fas fa-circle-notch fa-spin"></i> : "Confirm"}
                                </button>
                                {!isDeleting && (
                                    <button className="cancel-btn"
                                            onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!showDeleteConfirm && (
                        <>
                            <button className="btn-secondary-formal" onClick={handleOpenDetails}>Details</button>
                            <button className="btn-primary-formal" onClick={handleSummaryRequest}>
                                <i className="fas fa-robot"></i> Summary
                            </button>
                        </>
                    )}
                </div>

                <div className="researcher-headshot-stack">
                    {paper.researchers?.map((r, idx) => (
                        <div key={r.auid} className="mini-headshot-wrapper clickable-headshot"
                             onClick={() => handleViewFullProfile(r.auid)}>
                            <img src={getMiniHeadshot(r.auid)} alt={r.auid} className="mini-headshot-img"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaperCard;