import React from 'react';
import {motion} from 'framer-motion';

import '../../styles/development/doc.css';

const DocHeader = ({
                       title = "Official Documentation for",
                       subtitle = "Comprehensive guidance for AUSME users"
                   }) => {
    const words = title.split(" ");

    const containerVariants = {
        hidden: {opacity: 0},
        visible: {opacity: 1, transition: {staggerChildren: 0.1}}
    };

    const itemVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {y: 0, opacity: 1}
    };

    return (
        <header className="header">
            <div className="titleArea">
                {/* Vertical Line and Dot Decoration */}
                <div className="decoration">
                    <div className="line"/>
                    <div className="dot"/>
                </div>

                <motion.h1
                    className="title"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {words.map((word, i) => (
                        <motion.span key={i} variants={itemVariants} className="wordSpace">
                            {word}{" "}
                        </motion.span>
                    ))}

                    <motion.span variants={itemVariants} className="ausmeBrand">
                        <span className="ausmeAu">AU</span>
                        <span className="ausmeSme">SME</span>
                    </motion.span>
                </motion.h1>

                {/* Animated Gradient Underline */}
                <motion.div
                    className="titleUnderline"
                    initial={{width: 0}}
                    animate={{width: "200px"}}
                    transition={{delay: 0.8, duration: 0.8}}
                />

                <p className="subtitle">{subtitle}</p>
            </div>

            <div className="logoContainer">
                <motion.img
                    initial={{scale: 0, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.5}}
                    src="https://ecm.eng.auburn.edu/images/find-expert-ai.png"
                    alt="Logo"
                    className="headerLogo"
                />
            </div>
        </header>
    );
};

export default DocHeader;