import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/footer.css';
import '../styles/user/feedback.css';
import {submitFeedback} from "../services/session.js";

const PublicFooter = ({ viewType = 'public' }) => {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            employee: null,
            comment: feedbackText,
            rating: rating || null
        };

        try {
            // 3. Send to backend
            const res = await submitFeedback(payload);

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsFeedbackOpen(false);
                    setSubmitted(false);
                    setFeedbackText('');
                    setRating(0);
                }, 3500);
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        }
    };

    if (viewType !== 'public') return null;

    return (
        <>
            <footer className="footer_content">
                <div className="tool_info">
                    {/* NAVIGATES TO YOUR ABOUT PAGE */}
                    <button
                        className="btn-about-ausme"
                        onClick={() => navigate('/public/about')}
                    >
                        About AUSME
                    </button>

                    <div className="powered_by_content">
                        Powered by
                        <a href="https://eng.auburn.edu/" className="link" target="_blank" rel="noreferrer"> SGCOE</a> and
                        <a href="https://eng.auburn.edu/ai-au/" className="link" target="_blank" rel="noreferrer"> AI@AU</a>
                    </div>

                    <button
                        className="feedback-button"
                        onClick={() => setIsFeedbackOpen(true)}
                    >
                        Feedback
                    </button>
                </div>
            </footer>

            {/* FEEDBACK POPUP */}
            <AnimatePresence>
                {isFeedbackOpen && (
                    <>

                        <motion.div
                            className="feedback-backdrop-public"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFeedbackOpen(false)}
                        />

                            <motion.div
                            className="feedback-modal centered professional-box"
                            initial={{ opacity: 0, scale: 0, x: "-100%", y: "-50%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                            exit={{ opacity: 0, scale: 0, x: "-100%", y: "-50%" }}
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
                                        <button type="button" className="close-btn-circle" onClick={() => setIsFeedbackOpen(false)}>&times;</button>
                                    </div>

                                    <div className="input-group-modern">
                                        <label className="field-label">Comments</label>
                                        <textarea
                                            placeholder="Please describe your experience..."
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
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
                                            disabled={!feedbackText}
                                        >
                                            <span>Send Feedback</span>
                                            <i className="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default PublicFooter;