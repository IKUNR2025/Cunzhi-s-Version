import React, {useEffect, useRef} from 'react';
import * as d3 from 'd3';
import {getCollegeIcon} from '../../services/icons.js';
import '../../styles/user/similar_card.css';
import {useHeadshots} from "../HeadshotContext.jsx";


const ProfileResearchCard = ({
                                 profile,
                                 layout = 'horizontal',
                                 isEditable = false,
                                 onVisibilityToggle,
                                 isUpdating = false
                             }) => {
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);

    const {getMiniHeadshot} = useHeadshots()

    const {
        auid, first_name, last_name, title, college_name, department_name,
        email, phone, location,
        google_scholar_id,
        cited_by, h_index, i10_index,
        cited_by_recent, h_index_recent, i10_index_recent,
        citation_per_year,
        public_status
    } = profile;

    const isPublic = public_status === 'include';


    useEffect(() => {
        if (chartRef.current && citation_per_year) {
            renderPremiumChart(citation_per_year, chartRef.current, tooltipRef.current, layout);
        }
    }, [auid, citation_per_year, layout]);

    return (
        <div className={`research-card-container ${layout}-layout ${isUpdating ? 'updating-fade' : ''}`}>
            <div ref={tooltipRef} className="chart-tooltip" style={{opacity: 0}}></div>

            {isEditable && (
                <div className="profile-visibility-controls">
                    <span className={`visibility-badge ${isPublic ? 'active' : 'hidden'}`}>
                        <i className={`fas ${isUpdating ? 'fa-spinner fa-spin' : (isPublic ? 'fa-eye' : 'fa-eye-slash')}`}></i>
                        {isPublic ? "Publicly Discoverable" : "Hidden from Public"}
                    </span>
                    <label className="ios-switch">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            disabled={isUpdating}
                            onChange={() => onVisibilityToggle(isPublic ? 'exclude' : 'include')}
                        />
                        <span className="ios-slider"></span>
                    </label>
                </div>
            )}

            <div className="card-inner-layout">
                <div className="identity-section">
                    <div className="faculty-avatar-frame">
                        <img src={getMiniHeadshot(auid)} alt={last_name} className="faculty-img-main"/>
                    </div>
                    <div className="identity-text">
                        <h2 className="faculty-name-main">{first_name} {last_name}</h2>
                        <p className="faculty-title-main"
                           dangerouslySetInnerHTML={{__html: title?.replace('\n', '<br/>')}}/>
                        <p className="dept-text-label">{department_name}</p>
                        <div className="college-identity-row">
                            <img src={getCollegeIcon(college_name)} alt="" className="college-mini-icon"/>
                            <span className="college-text-label">{college_name}</span>
                        </div>
                    </div>
                </div>

                <div className="data-section">
                    <div className="chart-header-centered">
                        <span>Research Impact History</span>
                    </div>

                    <div className="chart-main-wrapper">
                        <svg ref={chartRef}></svg>
                    </div>

                    <div className="metrics-display-group">
                        <MetricBlock label="Citations" total={cited_by} recent={cited_by_recent}/>
                        <MetricBlock label="h-index" total={h_index} recent={h_index_recent}/>
                        <MetricBlock label="i10-index" total={i10_index} recent={i10_index_recent}/>
                    </div>
                </div>
            </div>

            <div className="footer-contact-bar">
                <div className="contact-links-group">
                    <div className="contact-unit"><i className="fas fa-envelope"></i> <span>{email}</span></div>
                    <div className="contact-unit"><i className="fas fa-phone"></i> <span>{phone}</span></div>
                    {/*<div className="contact-unit"><i className="fas fa-map-marker-alt"></i> <span>{location}</span>*/}
                    {/*</div>*/}
                    <a href={google_scholar_id} target="_blank" rel="noreferrer" className="contact-unit scholar-link">
                        <i className="fas fa-graduation-cap"></i> <span>Google Scholar</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

const MetricBlock = ({label, total, recent}) => (
    <div className="metric-container-formal">
        <span className="metric-label-main">{label}</span>
        <div className="metric-value-row">
            <div className="metric-segment">
                <span className="segment-label">Total</span>
                <span className="segment-value">{total}</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-segment">
                <span className="segment-label">Recent</span>
                <span className="segment-value orange-text">{recent}</span>
            </div>
        </div>
    </div>
);

const renderPremiumChart = (rawData, svgRef, tooltipRef, layout) => {
    let data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    if (!Array.isArray(data) || data.length === 0) return;

    const svg = d3.select(svgRef);
    const tooltip = d3.select(tooltipRef);
    svg.selectAll("*").remove();

    const width = layout === 'horizontal' ? 480 : 320;
    const height = 120;
    const margin = {top: 20, right: 10, bottom: 20, left: 35};
    const maxVal = d3.max(data, d => d.citations) || 0;

    const x = d3.scaleBand().domain(data.map(d => d.year)).range([margin.left, width - margin.right]).padding(0.4);
    const y = d3.scaleLinear().domain([0, maxVal * 1.1]).nice().range([height - margin.bottom, margin.top]);

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    svg.append("g").selectAll("rect").data(data).join("rect")
        .attr("x", d => x(d.year))
        .attr("width", x.bandwidth())
        .attr("fill", "#03244d")
        .attr("rx", 2)
        .attr("y", height - margin.bottom)
        .attr("height", 0)
        .on("mouseover", function (event, d) {
            const rect = this.getBoundingClientRect();
            const svgRect = svgRef.getBoundingClientRect();

            d3.select(this).attr("fill", "#f66733");

            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`${d.year}: ${d.citations} Citations`)
                .style("left", (rect.left + rect.width / 2) + "px")
                .style("top", (rect.top - 30) + "px")
                .style("transform", "translateX(-50%)");
        })
        .on("mousemove", function (event, d) {
            const rect = this.getBoundingClientRect();
            tooltip.style("left", (rect.left + rect.width / 2) + "px")
                .style("top", (rect.top - 30) + "px");
        })
        .on("mouseout", function (event) {
            d3.select(this).attr("fill", "#03244d");
            tooltip.transition().duration(100).style("opacity", 0);
        })
        .transition().duration(1000)
        .attr("y", d => y(d.citations))
        .attr("height", d => y(0) - y(d.citations));

    const visibleTicks = data.length > 1 ? [data[0].year, data[data.length - 1].year] : [data[0]?.year];

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickValues(visibleTicks).tickSize(0).tickPadding(8))
        .call(g => g.select(".domain").attr("stroke", "#eee"))
        .style("font-size", "10px").style("color", "#999");
};

export default ProfileResearchCard;