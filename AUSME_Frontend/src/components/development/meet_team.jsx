import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {fetchMeetTeam} from '../../services/user.js';
import DocHeader from './header.jsx';
import MeetTeamCard from './MeetTeamCard.jsx';
import '../../styles/development/meetTeam.css';

const MeetTeam = () => {
    const [teamGroups, setTeamGroups] = useState({
        DEVELOPMENT: [],
        CONTRIBUTOR: [],
        ACKNOWLEDGEMENT: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMeetTeam().then(data => {
            setTeamGroups({
                DEVELOPMENT: data.filter(m => m.category === 'DEVELOPMENT'),
                CONTRIBUTOR: data.filter(m => m.category === 'CONTRIBUTOR'),
                ACKNOWLEDGEMENT: data.filter(m => m.category === 'ACKNOWLEDGEMENT')
            });
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="loader"></div>;

    return (
        <div className="team_container">
            <div className="team-display-section">
                <DocHeader title="Meet Our Team" subtitle="The Architects of Excellence"/>

                <TeamGridSection title="Core Development" members={teamGroups.DEVELOPMENT}/>
                <TeamGridSection title="Past Contributors" members={teamGroups.CONTRIBUTOR}/>
                <TeamGridSection title="Special Acknowledgements" members={teamGroups.ACKNOWLEDGEMENT} isSpecial/>
            </div>
        </div>
    );
};

const TeamGridSection = ({ title, members, isSpecial, sectionKey }) => {
    if (members.length === 0) return null;

    return (
        <section className={`section-block ${isSpecial ? 'special-tier' : ''}`}>
            <div className="category-header-wrapper">
                <h2 className="category-title">{title}</h2>
                <div className="category-line-animated" />
            </div>
            <div className="team-grid-container">
                {members.map((member, index) => {
                    const uniqueId = member.auid && member.auid !== "N/A" ? member.auid : `fallback-${index}`;
                    const safeKey = `${sectionKey}-${uniqueId}`;

                    const sanitizedMember = {
                        ...member,
                        image: (member.image && member.image.trim() !== "") ? member.image : null
                    };

                    return (
                        <MeetTeamCard
                            key={safeKey}
                            member={sanitizedMember}
                            index={index}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default MeetTeam;