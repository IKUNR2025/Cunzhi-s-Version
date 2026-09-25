import React from 'react';
import {motion} from 'framer-motion';
import {getCollegeIcon} from '../../services/icons.js';
import {useHeadshots} from "../HeadshotContext";


const MeetTeamCard = ({member, index}) => {
    const {auid, first_name, last_name, title, role, email, department, college} = member;

    const {getMiniHeadshot} = useHeadshots();

    return (
        <motion.div
            className="advanced-split-card"
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, delay: (index % 3) * 0.1}}
        >
            <div className="card-inner-wrapper">
                <div className="card-media-side">
                    <img src={getMiniHeadshot(auid)} alt={first_name} className="side-img"/>
                    <div className="role-ribbon-bottom">{role}</div>
                </div>

                <div className="card-info-side">
                    <div className="info-main">
                        <h3 className="member-name">
                            {first_name} <span className="bold-last">{last_name}</span>
                        </h3>
                        <p className="professional-title">{title}</p>

                        <div className="metadata-stack">
                            <span className="dept-label">{department}</span>
                            <div className="college-identity">
                                <img src={getCollegeIcon(college)} alt="" className="college-icon"/>
                                <span className="college-name">{college}</span>
                            </div>
                        </div>
                    </div>

                    <div className="info-footer">
                        <a href={`mailto:${email}`} className="connect-link">
                            <span className="connect-text">Connect with {first_name}</span>
                            <div className="connect-circle">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="3">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MeetTeamCard;