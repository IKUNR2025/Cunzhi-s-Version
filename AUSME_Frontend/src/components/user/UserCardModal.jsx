import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserCard from './UserCard';

const UserCardModal = ({
    profile,
    isOpen,
    onClose,
    onViewProfile,
    isAdminMode = false,
    onToggleStatus = null,
    canInspect = false
}) => {

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-fixed-overlay">
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="modal-content-container"
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{
                            duration: 0.25,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                    >
                        <div className="modal-card-wrapper" style={{ position: 'relative' }}>
                            <motion.button
                                className="modal-close-btn-integrated"
                                onClick={onClose}
                                whileHover={{ backgroundColor: '#f66733', color: '#fff' }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <i className="fas fa-times"></i>
                            </motion.button>

                            <UserCard
                                profile={profile}
                                onViewProfile={(auid) => {
                                    onViewProfile(auid);
                                    onClose();
                                }}
                                isAdminMode={isAdminMode}
                                onToggleStatus={onToggleStatus}
                                canInspect={canInspect}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserCardModal;