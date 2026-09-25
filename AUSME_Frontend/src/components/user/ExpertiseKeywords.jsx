import React, { useEffect, useState } from 'react';
import '../../styles/expertise.css';

const ExpertiseKeywords = ({ keywords }) => {
    const [animated, setAnimated] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`word-cloud-container ${hoveredIndex !== null ? 'is-hovering' : ''}`}>
            {keywords.map((kw, index) => {
                const percentage = kw.relevance * 100;
                const radius = 15;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;

                return (
                    <div
                        key={index}
                        className={`word-container ${hoveredIndex === index ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                            animationDelay: `${index * 50}ms`,
                            opacity: animated ? (hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1) : 0,
                            transform: animated ? 'translateY(0)' : 'translateY(15px)'
                        }}
                    >
                        <span className="word">{kw.text}</span>

                        <div className="progress-ring-container">
                            <svg width="40" height="40">
                                <circle
                                    className="progress-ring-bg"
                                    stroke="#eef1f5"
                                    strokeWidth="3"
                                    fill="transparent"
                                    r={radius}
                                    cx="20"
                                    cy="20"
                                />
                                <circle
                                    className="progress-ring-fill"
                                    stroke="var(--auburn_orange)"
                                    strokeWidth="3.5"
                                    strokeDasharray={circumference}
                                    style={{
                                        strokeDashoffset: animated ? strokeDashoffset : circumference
                                    }}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r={radius}
                                    cx="20"
                                    cy="20"
                                />
                            </svg>
                            <span className="percentage-text">{Math.round(percentage)}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ExpertiseKeywords;