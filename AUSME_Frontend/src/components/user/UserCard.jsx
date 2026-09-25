import React, {memo} from 'react';
import {motion} from 'framer-motion';
import {getCollegeIcon} from '../../services/icons.js';
import '../../styles/user/user.css';
import {useHeadshots} from "../HeadshotContext.jsx";


const UserCard = ({
                      profile,
                      onViewProfile,
                      mode = "standard",
                      matchedTitles = [],
                      isAdminMode = false,
                      onToggleStatus = null,
                      canInspect = false
                  }) => {
    const {
        faculty_id, first_name, last_name, title,
        department_name, faculty_top_topics, email,
        phone, google_scholar_url, status
    } = profile;


    const containerVariants = {
        hidden: {
            opacity: 0,
            scale: 0.98,
            clipPath: "inset(10% 0% 10% 0%)"
        },
        visible: {
            opacity: 1,
            scale: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            transition: {
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: {opacity: 0, y: 20, filter: "blur(5px)"},
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 90,
                damping: 12
            }
        }
    };

    const shouldShowKeywords = mode === 'result' || !isAdminMode;

    const { getMiniHeadshot } = useHeadshots();

    return (
        <motion.div
            className={`general-info-card ${mode === 'result' ? 'result-card-style' : ''} ${isAdminMode && status === 'exclude' ? 'excluded-member-dim' : ''}`}
            initial={false}
            whileInView="visible"
            viewport={{once: true, margin: "-100px"}}
            variants={containerVariants}
        >
            <div className="card-image-section">
                <motion.img
                    initial={{scale: 1.3, filter: "grayscale(0.8) brightness(0.7)"}}
                    animate={{scale: 1, filter: "grayscale(0) brightness(1)"}}
                    transition={{duration: 1.2, ease: "easeOut"}}
                    src={getMiniHeadshot(faculty_id)}
                    alt={`${first_name} ${last_name}`}
                    className="profile-image"
                />
                <div className="image-overlay-gradient"></div>
                {isAdminMode && status === 'exclude' && (
                    <div className="status-ribbon-overlay">EXCLUDED</div>
                )}
            </div>

            <div className="card-content-section">
                <div className="profile-main-body">
                    <div className="faculty-identity-group">
                        <motion.h2 variants={itemVariants} className="faculty-name">
                            {first_name} {last_name}
                        </motion.h2>

                        <motion.div variants={itemVariants} className="faculty-title">
                            <span dangerouslySetInnerHTML={{__html: title?.replaceAll('/n', '<br>')}}/>
                        </motion.div>

                        <motion.div variants={itemVariants} className="dept-text-only">
                            {department_name}
                        </motion.div>

                        <motion.div variants={itemVariants} className="college-identity-row">
                            <img
                                src={getCollegeIcon(profile.college_name)}
                                alt={profile.college_name}
                                className="college-logo-large"
                            />
                            <span className="college-name-label">{profile.college_name}</span>
                        </motion.div>
                    </div>

                    {shouldShowKeywords && (
                        <motion.div variants={itemVariants} className="keyword-wrapper">
                            {mode === 'result' ? (
                                <div className="matched-titles-container">
                                    {(matchedTitles.length > 0 ? matchedTitles : (profile.matched_publications || [])).map((item, index) => (
                                        <div key={index} className="title-tag" style={{"--delay": `${index * 0.2}s`}}>
                                            <span className="query-label">MATCHED RESEARCH</span>
                                            <span className="title-text">{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="expertise-flex-container">
                                    {faculty_top_topics?.map((topic, index) => (
                                        <motion.span
                                            key={index}
                                            className="expertise-chip"
                                        >
                                            {topic.topic}
                                        </motion.span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="card-action-footer">
                    {isAdminMode ? (
                        <div className="admin-controls-wrapper" style={{
                            display: 'flex',
                            gap: '10px',
                            width: '100%',
                            padding: '15px',
                            background: '#f8fafc'
                        }}>
                            <motion.button
                                variants={itemVariants}
                                whileTap={{scale: 0.95}}
                                className={`admin-toggle-btn ${status}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStatus(faculty_id, status);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    backgroundColor: status === 'include' ? '#dcfce7' : '#fee2e2',
                                    color: status === 'include' ? '#166534' : '#991b1b',
                                    fontWeight: '700',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <i className={`fas ${status === 'include' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                {status === 'include' ? 'ACTIVE: INCLUDED' : 'HIDDEN: EXCLUDED'}
                            </motion.button>

                            {canInspect && (
                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{backgroundColor: '#f1f5f9'}}
                                    className="admin-inspect-btn"
                                    onClick={() => onViewProfile(faculty_id)}
                                    style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <i class="fas fa-binoculars"></i>
                                </motion.button>
                            )}
                        </div>
                    ) : (
                        <>
                            <motion.div variants={itemVariants} className="social-icon-bar">
                                {[
                                    {href: `mailto:${email}`, icon: "fa-envelope"},
                                    {href: `tel:${phone}`, icon: "fa-phone"},
                                    {href: google_scholar_url, icon: "fa-graduation-cap"}
                                ].map((item, i) => (
                                    <motion.a
                                        key={i}
                                        href={item.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="action-icon-link"
                                        whileHover={{scale: 1.25, y: -4, color: '#03244d'}}
                                    >
                                        <i className={`fas ${item.icon}`}></i>
                                    </motion.a>
                                ))}
                            </motion.div>

                            <motion.button
                                className="advanced-view-btn"
                                onClick={() => onViewProfile(faculty_id)}
                                initial="rest"
                                whileHover="hover"
                                animate="rest"
                            >
                                <motion.span
                                    className="btn-label-text"
                                    variants={{rest: {x: 0}, hover: {x: -8}}}
                                    transition={{type: "spring", stiffness: 300, damping: 20}}
                                >
                                    VIEW PROFILE
                                </motion.span>
                                <div className="btn-arrow-morph">
                                    <motion.span
                                        className="arrow-primary"
                                        variants={{rest: {x: 0, opacity: 1}, hover: {x: 30, opacity: 0}}}
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </motion.span>
                                    <motion.span
                                        className="arrow-secondary"
                                        initial={{x: -30, opacity: 0}}
                                        variants={{rest: {x: -30, opacity: 0}, hover: {x: 0, opacity: 1}}}
                                    >
                                        <i className="fas fa-arrow-right"></i>
                                    </motion.span>
                                </div>
                            </motion.button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default memo(UserCard);