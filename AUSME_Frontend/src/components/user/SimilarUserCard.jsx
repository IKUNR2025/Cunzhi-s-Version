import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {getCollegeIcon} from '../../services/icons.js';
import '../../styles/user/similar_card.css';

const headshots = import.meta.glob("../../assets/headshots/*.jpg", {eager: true});

const SimilarUserCard = ({profile, onClick}) => {
    const {auid, first_name, last_name, college} = profile;

    const getHeadshot = (id) => {
        const key = `../../assets/headshots/${id?.toLowerCase()}.jpg`;
        return headshots[key]?.default || headshots['../../assets/headshots/profile_icon.jpg']?.default;
    };

    return (
        <motion.div
            className="card"
            onClick={() => onClick && onClick(auid)}
        >
            <div className="card-top-content">
                <img
                    src={getHeadshot(auid)}
                    alt={`${first_name} ${last_name}`}
                    className="similar-card-img"
                />
                <div className="name">{first_name} {last_name}</div>
            </div>

            <div className="college-info-group">
                <img
                    src={getCollegeIcon(college)}
                    alt=""
                    className="similar-college-icon"
                    style={{width: '25px', height: '25px', filter: 'brightness(0) invert(1)'}}
                />
                <div className="department-label">{college}</div>
            </div>
        </motion.div>
    );
};

export default SimilarUserCard;