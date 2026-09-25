import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {logoutUser, refreshAccessToken, isAccessTokenValid, getTokenRemainingTime, getAccessToken} from '../services/session.js';
import '../styles/session_modal.css';

const WARNING_BUFFER = 60;
const IDLE_THRESHOLD = 120000;

const SessionTimeoutModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const lastActivity = useRef(Date.now());
    const isRefreshing = useRef(false); // THE CRITICAL LOCK

    useEffect(() => {
        const updateActivity = () => {
            lastActivity.current = Date.now();
        };
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);
        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
        };
    }, []);

    useEffect(() => {
        const checkInterval = setInterval(async () => {
            // 1. If we are already refreshing or the modal is closing, STOP.
            if (isRefreshing.current) return;

            // 2. Double check if we even have a token to check
            const token = getAccessToken();
            if (!token) return;

            const isValid = isAccessTokenValid();
            const isIdle = (Date.now() - lastActivity.current) > IDLE_THRESHOLD;

            if (!isValid) {
                if (isIdle) {
                    if (!showModal) {
                        const timeLeft = getTokenRemainingTime();
                        if (timeLeft > 0) {
                            setCountdown(timeLeft);
                            setShowModal(true);
                        } else {
                            clearInterval(checkInterval); // STOP THE TIMER
                            logoutUser();
                        }
                    }
                } else {
                    isRefreshing.current = true;
                    try {
                        await refreshAccessToken();
                    } catch (err) {
                        clearInterval(checkInterval); // STOP THE TIMER
                        logoutUser();
                    } finally {
                        isRefreshing.current = false;
                    }
                }
            }
        }, 5000);

        return () => clearInterval(checkInterval);
    }, [showModal]);

    useEffect(() => {
        let timer;
        if (showModal && countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        } else if (showModal && countdown <= 0) {
            logoutUser();
        }
        return () => clearInterval(timer);
    }, [showModal, countdown]);

    const handleExtend = async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        try {
            await refreshAccessToken();
            setShowModal(false);
        } catch (err) {
            logoutUser();
        } finally {
            isRefreshing.current = false;
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const pulseDuration = countdown > 20 ? 1.5 : 0.6;

    return (
        <AnimatePresence>
            {showModal && (
                <div className="session-overlay">
                    <motion.div
                        className="session-glass-card"
                        initial={{scale: 0.8, opacity: 0, y: 50}}
                        animate={{scale: 1, opacity: 1, y: 0}}
                        exit={{scale: 0.8, opacity: 0, y: 50}}
                    >
                        <div className="session-icon">
                            <motion.i
                                className="fa-solid fa-hourglass-half"
                                animate={{rotate: 360}}
                                transition={{repeat: Infinity, duration: 3, ease: "linear"}}
                            />
                        </div>
                        <h2>Session Security</h2>
                        <p>You have been idle. Session expires in:</p>

                        <motion.div
                            className="countdown-circle"
                            animate={{
                                boxShadow: ["0 0 20px rgba(246, 103, 51, 0.3)", "0 0 40px rgba(246, 103, 51, 0.6)", "0 0 20px rgba(246, 103, 51, 0.3)"],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{repeat: Infinity, duration: pulseDuration, ease: "easeInOut"}}
                        >
                            <span className="seconds">{formatTime(countdown)}</span>
                            <span className="label">Remaining</span>
                        </motion.div>

                        <div className="session-actions">
                            <button className="btn-logout-minimal" onClick={logoutUser}>Logout</button>
                            <button className="btn-extend-auburn" onClick={handleExtend}>Stay Logged In</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SessionTimeoutModal;