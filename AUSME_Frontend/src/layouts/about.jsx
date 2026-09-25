import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {Users, FileText, Plus, Minus, HelpCircle, Info, BuildingIcon, Building2, BriefcaseBusiness, TextSearchIcon} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMeetTeam } from '../services/user.js';
import { documentationService } from '../services/doc.js';
import { getCollegeIcon } from '../services/icons.js';
import '../styles/development/meetTeam.css';
import '../styles/development/doc.css';
import '../styles/development/about.css'
import {fetchOpenAgencies} from "../services/opp.js";

const headshots = import.meta.glob("../assets/headshots/*.jpg", { eager: true });

const CountUp = ({ to }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());
    useEffect(() => {
        const controls = animate(count, to, { duration: 2, ease: "easeOut" });
        return controls.stop;
    }, [count, to]);
    return <motion.span>{rounded}</motion.span>;
};

const DocHeader = ({ title = "Official Documentation for", subtitle = "Comprehensive guidance for AUSME users" }) => {
    const words = title.split(" ");
    return (
        <header className="header">
            <div className="titleArea">
                <div className="decoration">
                    <div className="line" />
                    <div className="dot" />
                </div>
                <motion.h1 className="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {words.map((word, i) => <span key={i}>{word} </span>)}
                    <span className="ausmeBrand"><span className="ausmeAu">AU</span><span
                        className="ausmeSme">SME</span></span>
                </motion.h1>
                <motion.div className="titleUnderline" initial={{ width: 0 }} animate={{ width: "200px" }}
                    transition={{ delay: 0.5 }} />
                <p className="subtitle">{subtitle}</p>
            </div>
            <div className="logoContainer">
                <img src="https://ecm.eng.auburn.edu/images/find-expert-ai.png" alt="Logo" className="headerLogo" />
            </div>
        </header>
    );
};

const MeetTeamCard = ({ member, index }) => {
    const getHeadshot = (id) => {
        const key = `../assets/headshots/${id?.toLowerCase()}.jpg`;
        return headshots[key]?.default || headshots['../assets/headshots/profile_icon.jpg']?.default;
    };
    return (
        <motion.div className="advanced-split-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 3) * 0.1 }}>
            <div className="card-inner-wrapper">
                <div className="card-media-side">
                    <img src={getHeadshot(member.auid)} alt={member.first_name} className="side-img" />
                    <div className="role-ribbon-bottom">{member.role}</div>
                </div>
                <div className="card-info-side">
                    <div className="info-main">
                        <h3 className="member-name">{member.first_name} <span
                            className="bold-last">{member.last_name}</span></h3>
                        <p className="professional-title">{member.title}</p>
                        <div className="metadata-stack">
                            <span className="dept-label">{member.department}</span>
                            <div className="college-identity">
                                <img src={getCollegeIcon(member.college)} alt="" className="college-icon" />
                                <span className="college-name">{member.college}</span>
                            </div>
                        </div>
                    </div>
                    <div className="info-footer">
                        <a href={`mailto:${member.email}`} className="connect-link">Connect with {member.first_name}</a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const About = () => {
    const [activeTab, setActiveTab] = useState('docs');
    const [activeFaq, setActiveFaq] = useState(null);

    // 1. Fetch Team Data via Query
    const { data: rawTeamData = [], isLoading: teamLoading } = useQuery({
        queryKey: ['teamData'],
        queryFn: fetchMeetTeam,
        staleTime: 1000 * 60 * 60, // Team data rarely changes, keep for 1 hour
    });

    // 2. Fetch Doc Data via Query
    const { data: docData = { stats: null, faqs: [] }, isLoading: docLoading } = useQuery({
        queryKey: ['docData'],
        queryFn: () => documentationService.getDocumentationData(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const {data: parentAgencies = []} = useQuery({
        queryKey: ['agencies'],
        queryFn: fetchOpenAgencies,
        staleTime: 1000 * 60 * 30,
    });

    // 3. Process categories using useMemo to prevent re-sorting on every render
    const categorizedTeam = useMemo(() => {
        return {
            DEVELOPMENT: rawTeamData.filter(m => m.category === 'DEVELOPMENT'),
            CONTRIBUTOR: rawTeamData.filter(m => m.category === 'CONTRIBUTOR'),
            ACKNOWLEDGEMENT: rawTeamData.filter(m => m.category === 'ACKNOWLEDGEMENT')
        };
    }, [rawTeamData]);

    const isLoading = teamLoading || docLoading;

    if (isLoading) return <div className="loader">Loading...</div>;

    return (
        <div className="about-page-container">
            <div className="tab-navigation">
                <button
                    className={`tab-button-about ${activeTab === 'docs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('docs')}
                >
                    <Info size={18} /> Documentation
                </button>
                <button
                    className={`tab-button-about ${activeTab === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveTab('team')}
                >
                    <Users size={18} /> Meet the Team
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'docs' ? (
                    <motion.div
                        key="docs"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="docScrollContainer"
                    >
                        <DocHeader />
                        <div className="statsGridWrapper">
                            <div className="statsGrid">
                                <StatCard icon={<Users size={28} />} label="AUSME Experts"
                                    value={docData.stats?.experts || 0} />
                                <StatCard icon={<FileText size={28} />} label="Scientific Papers"
                                    value={docData.stats?.papers || 0} />
                                <StatCard icon={<TextSearchIcon size={28} />} label="Searchable Keywords"
                                    value={docData.stats?.keywords || 0} />
                                <StatCard icon={<BriefcaseBusiness size={28} />} label="Open Funding Opportunities"
                                    value={docData.stats?.opportunities || 0} />
                                <StatCard icon={<BuildingIcon size={28} />} label="Funding Agencies"
                                    value={parentAgencies.length || 0} />

                            </div>
                        </div>

                        <section className="faqWrapper">
                            <div className="faqHeaderContainer">
                                <HelpCircle className="faqTitleIcon" size={32} />
                                <h2 className="faqMainTitle">Frequent Q&A</h2>
                            </div>
                            <div className="faqList">
                                {docData.faqs.map((faq) => (
                                    <div key={faq.id} className="faqItem">
                                        <button
                                            className={`faqHeader ${activeFaq === faq.id ? 'active' : ''}`}
                                            onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                                        >
                                            <span className="faqQuestion"
                                                dangerouslySetInnerHTML={{ __html: faq.question }} />
                                            {activeFaq === faq.id ? <Minus size={20} /> : <Plus size={20} />}
                                        </button>
                                        <AnimatePresence>
                                            {activeFaq === faq.id && (
                                                <motion.div initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }} className="faqContent">
                                                    <div className="answerInner"
                                                        dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div
                        key="team"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="team_container"
                    >
                        <DocHeader title="Meet Our Team" subtitle="The Architects of Excellence" />

                        <TeamSection title="Core Development" members={categorizedTeam.DEVELOPMENT} />
                        <TeamSection title="Past Contributors" members={categorizedTeam.CONTRIBUTOR} />
                        <TeamSection title="Special Acknowledgements" members={categorizedTeam.ACKNOWLEDGEMENT} isSpecial />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ label, value, icon }) => (
    <div className="statCard">
        <div className="statIconWrapper">{icon}</div>
        <div className="statValue"><CountUp to={value} /></div>
        <span className="statLabel">{label}</span>
    </div>
);

const TeamSection = ({ title, members, isSpecial }) => {
    if (!members.length) return null;
    return (
        <section className={`section-block ${isSpecial ? 'special-tier' : ''}`}>
            <div className="category-header-wrapper">
                <h2 className="category-title">{title}</h2>
                <div className="category-line-animated" />
            </div>
            <div className="team-grid-container">
                {members.map((m, i) => <MeetTeamCard key={m.auid || i} member={m} index={i} />)}
            </div>
        </section>
    );
};

export default About;