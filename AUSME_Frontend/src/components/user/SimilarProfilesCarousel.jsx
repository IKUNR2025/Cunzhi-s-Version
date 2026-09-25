import React, { useState, useEffect, useRef } from 'react';
import SimilarUserCard from './SimilarUserCard';
import '../../styles/user/similar_card.css';

const SimilarProfilesCarousel = ({ profiles, onProfileClick }) => {
    const [angle, setAngle] = useState(0);
    const [radius, setRadius] = useState(200);
    const containerRef = useRef(null);
    const timerRef = useRef(null);

    const count = profiles.length || 1;
    const cardAngleStep = 360 / count;

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setRadius(width * 0.4);
            }
        };
        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) observer.observe(containerRef.current);
        updateDimensions();
        return () => observer.disconnect();
    }, []);

    const getCardStyles = (index) => {
        const currentRotation = (index * cardAngleStep + angle) % 360;
        const normalizedAngle = ((currentRotation + 180) % 360) - 180;

        const isFront = Math.abs(normalizedAngle) < (cardAngleStep / 2);

        return {
            transform: `rotateY(${index * cardAngleStep}deg) translateZ(${radius}px)`,
            zIndex: isFront ? 1000 : Math.round(100 - Math.abs(normalizedAngle)),
            opacity: isFront ? 1 : 0.4,
            pointerEvents: isFront ? 'auto' : 'none',
            transition: 'transform 0.8s ease, opacity 0.5s ease, z-index 0s'
        };
    };

    const rotate = (dir) => setAngle(prev => prev + (dir * cardAngleStep));

    useEffect(() => {
        timerRef.current = setInterval(() => rotate(-1), 5000);
        return () => clearInterval(timerRef.current);
    }, [count]);

    return (
        <div className="similar_profiles_component" ref={containerRef}>
            <button className="carousel-control left-control" onClick={() => rotate(1)}>
                <i className="fas fa-chevron-left"></i>
            </button>

            <div className="top_similar_profiles">
                <div className="carousel-container">
                    <div className="carousel" style={{ transform: `translateZ(-${radius}px) rotateY(${angle}deg)` }}>
                        {profiles.map((profile, index) => (
                            <div
                                key={profile.auid}
                                className="carousel-item-wrapper"
                                style={getCardStyles(index)}
                            >
                                <SimilarUserCard profile={profile} onClick={onProfileClick} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button className="carousel-control right-control" onClick={() => rotate(-1)}>
                <i className="fas fa-chevron-right"></i>
            </button>
        </div>
    );
};

export default SimilarProfilesCarousel;