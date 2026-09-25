import React from 'react';
import { motion } from 'framer-motion';

const TabSwitcher = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'find-experts', label: 'Find Experts', icon: 'fa-search' },
        { id: 'expert-profile', label: 'Expert Profile', icon: 'fa-user-tie' }
    ];

    return (
        <div className="tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    <i className={`fas ${tab.icon}`}></i>
                    <span style={{ position: 'relative', zindex: 2 }}>{tab.label}</span>

                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="active-pill"
                            className="active-pill"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
};

export default TabSwitcher;