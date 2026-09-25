import React, { useEffect, useRef, memo, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ResearcherWorldMap = memo(({ coauthors = [] }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const locations = useMemo(() => (coauthors || []).map(coauthor => {
        const authorName = Object.keys(coauthor)[0];
        const data = coauthor[authorName];
        return {
            name: authorName,
            university: data.university_name,
            coords: [parseFloat(data.longitude), parseFloat(data.latitude)]
        };
    }).filter(d => !isNaN(d.coords[0]) && !isNaN(d.coords[1])), [coauthors]);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

        const { width, height } = dimensions;
        const svg = d3.select(svgRef.current);

        svg.selectAll("*").remove();

        svg.attr("viewBox", `0 0 ${width} ${height}`)
           .attr("preserveAspectRatio", "xMidYMid slice");

        const projection = d3.geoNaturalEarth1()
            .scale(Math.min(width / 5.5, height / 2.8))
            .translate([width / 2, height / 1.5]);

        const path = d3.geoPath().projection(projection);

        const g = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world) => {
            const countries = topojson.feature(world, world.objects.countries);

            g.append("path")
                .datum(countries)
                .attr("d", path)
                .attr("fill", "#03244D")
                .attr("stroke", "rgba(232, 119, 34, 0.95)")
                .attr("stroke-width", 0.5);

            const markers = g.selectAll(".marker-group")
                .data(locations)
                .enter()
                .append("g");

            markers.append("circle")
                .attr("cx", d => projection(d.coords)[0])
                .attr("cy", d => projection(d.coords)[1])
                .attr("r", Math.max(width * 0.006, 4))
                .attr("fill", "#f66733")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .style("cursor", "pointer")
                .append("title")
                .text(d => `${d.name}\n${d.university}`);

            markers.append("circle")
                .attr("cx", d => projection(d.coords)[0])
                .attr("cy", d => projection(d.coords)[1])
                .attr("r", Math.max(width * 0.006, 4))
                .attr("fill", "none")
                .attr("stroke", "#f66733")
                .attr("stroke-width", 1)
                .attr("class", "pulse-ring")
                .each(function repeat() {
                    d3.select(this)
                        .attr("r", Math.max(width * 0.006, 4))
                        .style("opacity", 0.8)
                        .transition()
                        .duration(2000)
                        .attr("r", Math.max(width * 0.02, 15))
                        .style("opacity", 0)
                        .on("end", repeat);
                });
        });
    }, [locations, dimensions]);

    return (
        <div ref={containerRef} className="world-map-viz-wrapper" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}></svg>
        </div>
    );
});

export default ResearcherWorldMap;