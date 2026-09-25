import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser, submitFeedback } from '../../services/session.js';
import '../../styles/user/feedback.css';

const FeedbackTab = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const user = getCurrentUser();
        const auid = user?.auid;

        if (!auid) {
            console.error("User identity not found");
            return;
        }

        const payload = {
            employee: auid,
            comment: feedback,
            rating: rating || null
        };

        try {
            // 3. Send to backend
            const res = await submitFeedback(payload);

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitted(false);
                    setFeedback('');
                    setRating(0);
                }, 3500);
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        }
    };

    return (
        <>
            {!isOpen && (
                <div
                    className="feedback-vertical-tab modern-anchored"
                    onClick={() => setIsOpen(true)}
                >
                    <i className="fas fa-comment-alt"></i>
                    <span>FEEDBACK</span>
                </div>
            )}

            <AnimatePresence>
                {isOpen && (
                    <div className="feedback-overlay">
                        <motion.div
                            className="feedback-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            className="feedback-modal centered professional-box"
                            initial={{ opacity: 0, scale: 0, x: "100%", y: "-50%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                            exit={{ opacity: 0, scale: 0, x: "100%", y: "-50%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            style={{ transformOrigin: "right center" }}
                        >
                            {submitted ? (
                                <div className="feedback-success">
                                    <div className="success-icon-wrapper">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    <h3>Success</h3>
                                    <p>Thank you for your valuable input.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="feedback-header-minimal">
                                        <h2 className="title-center">FEEDBACK</h2>
                                        <button type="button" className="close-btn-circle" onClick={() => setIsOpen(false)}>&times;</button>
                                    </div>

                                    <div className="input-group-modern">
                                        <label className="field-label">Comments</label>
                                        <textarea
                                            placeholder="Please describe your experience..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="rating-group-below">
                                        <label className="field-label">Rating (Optional)</label>
                                        <div className="stars-row-modern">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <i
                                                    key={star}
                                                    className={`fa-star ${star <= (hoverRating || rating) ? 'fas active' : 'far'}`}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                ></i>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="feedback-footer-action">
                                        <button
                                            type="submit"
                                            className="submit-btn-auburn"
                                            disabled={!feedback}
                                        >
                                            <span>Send Feedback</span>
                                            <i className="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FeedbackTab;