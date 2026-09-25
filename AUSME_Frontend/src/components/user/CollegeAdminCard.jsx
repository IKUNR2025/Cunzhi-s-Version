import React from 'react';
import { motion } from 'framer-motion';
import { getCollegeIcon } from '../../services/icons';

const CollegeAdminCard = ({ college, onToggle }) => {
    const icon = getCollegeIcon(college.name);
    const status = college.status || 'include';
    const isIncluded = status === 'include';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`college-admin-card ${status}`}
        >
            <div className="card-accent-bar" />
            <div className="card-content">
                <div className="college-visual">
                    {icon ? (
                        <img src={icon} alt="" className="college-logo-img" />
                    ) : (
                        <div className="college-icon-fallback">
                            <i className="fas fa-university"></i>
                        </div>
                    )}
                    <div className={`status-pill ${status}`}>
                        <span className="pulse-dot"></span>
                        {status.toUpperCase()}
                    </div>
                </div>

                <div className="college-details">
                    <h3>{college.name}</h3>
                    <p>{isIncluded ? 'Visible to public users' : 'Hidden from public portal'}</p>
                </div>

                <div className="college-actions">
                    <button
                        className={`toggle-action-btn ${isIncluded ? 'to-exclude' : 'to-include'}`}
                        onClick={() => onToggle(college.id, status)}
                    >
                        {isIncluded ? (
                            <><i className="fas fa-eye-slash"></i> Exclude</>
                        ) : (
                            <><i className="fas fa-eye"></i> Include</>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CollegeAdminCard;