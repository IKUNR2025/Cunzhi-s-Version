import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence, useMotionValue, useTransform, animate} from 'framer-motion';
import {Users, FileText, Hash, Plus, Minus, HelpCircle} from 'lucide-react';
import {documentationService} from '../../services/doc.js';
import DocHeader from './header.jsx';

import '../../styles/development/doc.css';


const Documentation = () => {
    const [data, setData] = useState({stats: null, faqs: []});
    const [activeIndex, setActiveIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPageData = async () => {
            try {
                const response = await documentationService.getDocumentationData();
                setData(response);
            } catch (error) {
                console.error("Failed to fetch documentation:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPageData();
    }, []);

    const containerVariants = {
        hidden: {opacity: 0},
        visible: {opacity: 1, transition: {staggerChildren: 0.1}}
    };

    const itemVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {y: 0, opacity: 1}
    };

    if (loading) return <div className="loader">Loading Documentation...</div>;

    return (
        <div className="docScrollContainer">
            <div className="docContentArea">

                <DocHeader/>

                <div className="statsGridWrapper">
                    <div className="statsGrid">
                        <StatCard icon={<Users size={28}/>} label="AUSME Experts" value={data.stats?.experts || 0}/>
                        <StatCard icon={<FileText size={28}/>} label="Scientific Papers"
                                  value={data.stats?.papers || 0}/>
                        <StatCard icon={<Hash size={28}/>} label="Searchable Keywords"
                                  value={data.stats?.keywords || 0}/>
                    </div>
                </div>

                <hr className="separator"/>

                <section className="faqWrapper">
                    <div className="faqHeaderContainer">
                        <HelpCircle className="faqTitleIcon" size={32}/>
                        <h2 className="faqMainTitle">Frequent Q&A</h2>
                    </div>

                    <motion.div className="faqList" initial="hidden" whileInView="visible"
                                viewport={{once: true}} variants={containerVariants}>
                        {data.faqs.map((faq) => (
                            <motion.div key={faq.id} variants={itemVariants} className="faqItem">
                                <button
                                    className={`faqHeader ${activeIndex === faq.id ? 'active' : ''}`}
                                    onClick={() => setActiveIndex(activeIndex === faq.id ? null : faq.id)}
                                >
                                    {/* Added decoration back in case it's needed for doc.css */}
                                    <div className="decoration">
                                        <div className="line"></div>
                                        <div className="dot"></div>
                                    </div>

                                    <span className="faqQuestion"
                                          dangerouslySetInnerHTML={{__html: faq.question}}/>
                                    <motion.div
                                        animate={{rotate: activeIndex === faq.id ? 180 : 0}}
                                        className="faqIcon"
                                    >
                                        {activeIndex === faq.id ? <Minus size={20}/> : <Plus size={20}/>}
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {activeIndex === faq.id && (
                                        <motion.div
                                            initial={{height: 0, opacity: 0}}
                                            animate={{height: "auto", opacity: 1}}
                                            exit={{height: 0, opacity: 0}}
                                            transition={{type: "spring", stiffness: 100, damping: 18}}
                                            className="faqContent"
                                        >
                                            <div className="answerInner"
                                                 dangerouslySetInnerHTML={{__html: faq.answer}}/>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            </div>
        </div>
    );
};

const StatCard = ({label, value, icon}) => (
    <div className="statCard">
        <div className="statIconWrapper">{icon}</div>
        <div className="statValue"><CountUp to={value}/></div>
        <span className="statLabel">{label}</span>
    </div>
);

export default Documentation;