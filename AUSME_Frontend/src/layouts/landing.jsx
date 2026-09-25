import React, {useEffect, useState, useMemo, useCallback, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {fetchColleges} from "../services/api.js";
import {getCollegeIcon} from "../services/icons.js";
import auLogo from '../assets/logo/au.png';
import "../styles/landing.css";

function LandingPage({ viewType = 'public' }) {
    const [colleges, setColleges] = useState([]);
    const [isExiting, setIsExiting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // CRITICAL: This Ref prevents the "Double Trigger" loop
    const exitTriggered = useRef(false);

    const BASE_DELAY = 1.8;
    const STAGGER = 0.25;
    const ANIM_DURATION = 1.2;

    const triggerExit = useCallback(() => {
        // If we already started exiting, STOP. Don't run this logic again.
        if (exitTriggered.current) return;

        exitTriggered.current = true;
        setIsExiting(true);

        setTimeout(() => {
            if (viewType === 'private') {
                navigate('/internal/login', { replace: true });
            } else {
                navigate('/public/find', { replace: true });
            }
        }, 1000);
    }, [navigate, viewType]);

    const handleSkip = () => triggerExit();

    useEffect(() => {
        let isMounted = true;
        fetchColleges(viewType)
            .then(data => {
                if (isMounted) {
                    setColleges(data);
                    setIsLoading(false);
                }
            })
            .catch(error => {
                console.error("Failed to fetch colleges:", error);
                if (isMounted) {
                    setIsLoading(false);
                    // Error fallback: wait 3 seconds then leave
                    setTimeout(() => triggerExit(), 3000);
                }
            });
        return () => { isMounted = false; };
    }, [viewType, triggerExit]);

    const totalSequenceTime = useMemo(() => {
        if (colleges.length === 0) return 5;
        return BASE_DELAY + ((colleges.length - 1) * STAGGER) + ANIM_DURATION;
    }, [colleges.length]);

    useEffect(() => {
        if (!isLoading) {
            // Start the auto-exit timer
            const timer = setTimeout(() => {
                triggerExit();
            }, (totalSequenceTime * 1000) + 500);

            // CLEANUP: If the user clicks skip, we kill this timer
            // so it doesn't fire while we are already navigating
            return () => clearTimeout(timer);
        }
    }, [isLoading, totalSequenceTime, triggerExit]);

    return (
        <div className={`launch-page ${isExiting ? "exit-active" : ""}`}>
            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{
                        animation: !isLoading
                            ? `progress-load ${totalSequenceTime}s linear forwards`
                            : 'none'
                    }}
                ></div>
            </div>

            <button className="skip-button" onClick={handleSkip}>
                {viewType === 'private' ? 'Enter Portal' : 'Skip Intro'} <span className="skip-arrow">→</span>
            </button>

            <img
                className="logo-cinematic"
                src={auLogo}
                alt="Logo"
            />

            <div className="department-buttons-container">
                {colleges.map((college, index) => {
                    const iconSrc = getCollegeIcon(college.name) || auLogo;
                    return (
                        <div
                            key={college.id || index}
                            className="department-button"
                            style={{
                                animationDelay: `${BASE_DELAY + (index * STAGGER)}s`,
                                animationDuration: `${ANIM_DURATION}s`
                            }}
                        >
                            <img
                                src={iconSrc}
                                alt={college.name}
                                className="department-icon"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default LandingPage;