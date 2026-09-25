import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import TabSwitcher from '../components/find_ausme/TabSwicher.jsx';
import SearchTab from '../components/find_ausme/SearchTab';
import ExpertDirectory from '../components/find_ausme/ExpertDirectory';
import '../styles/find_ausme/find_ausme.css';
import Footer from "../components/footer.jsx";

const FindAusme = ({ viewType = 'public' }) => {
    const [activeTab, setActiveTab] = useState('find-experts');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'find-experts':
                return <SearchTab viewType={viewType} />;
            case 'expert-profile':
                return <ExpertDirectory viewType={viewType} />;
            default:
                return <SearchTab viewType={viewType} />;
        }
    };

    return (
        <div className="find_expert_content"
             style={{display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#e7e9ec'}}>
            <div className="top_view">
                <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab}/>
            </div>

            <div className="tab-container-wrapper" style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{opacity: 0, y: 15}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -15}}
                        transition={{duration: 0.25, ease: "easeOut"}}
                        style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>


            {viewType === 'public' && (
                <div className="public-footer-container">
                    <Footer />
                </div>
            )}
        </div>
    );
};

export default FindAusme;