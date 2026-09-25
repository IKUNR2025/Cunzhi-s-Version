import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { registerResearcher } from "../../services/session.js";
import FormInput from "../login/FormInput.jsx";
import AuthButton from "../login/authButton.jsx";
import SuccessPopup from "../login/SuccessPopup.jsx";
import "../../styles/login.css";

const AddUserModal = ({ isOpen, onClose }) => {
    const [form, setForm] = useState({ employeeId: "", gsId: "", firstname: "", lastname: "", orcid: "", reason: "" });
    const [status, setStatus] = useState({
        loading: false,
        error: null,
        success: false,
        errorCount: 0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await registerResearcher({
                employee_id: form.employeeId,
                gs_id: form.gsId,
                first_name: form.firstname,
                last_name: form.lastname,
                orcid_id: form.orcid,
                reason: form.reason
            });

            if (data.success) {
                // 1. Reset form
                setForm({ employeeId: "", gsId: "", firstname: "", lastname: "", orcid: "", reason: "" });
                // 2. Close the Add Form Modal first
                onClose();
                // 3. Trigger the Success Popup
                setStatus(prev => ({ ...prev, success: true, loading: false }));
            } else {
                throw new Error(data.error || "Registration failed");
            }
        } catch (err) {
            setStatus(prev => ({
                ...prev,
                error: err.message,
                loading: false,
                errorCount: prev.errorCount + 1
            }));
        }
    };

    const handleSuccessClose = () => {
        setStatus(prev => ({ ...prev, success: false }));
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="login-container" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        zIndex: 9999,
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(8px)',
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }} onClick={onClose}>

                        <motion.div
                            className="login-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '95%', maxWidth: '450px' }}
                        >
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    right: '20px',
                                    top: '20px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>

                            <div className="card-header">
                                <div className="accent-line"></div>
                                <h2>Add Researcher</h2>
                                <p>Provide identifiers to index a <span className="highlight-text">new faculty profile</span></p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <FormInput
                                    label="AUID * e.g.(AUB1234)"
                                    value={form.employeeId}
                                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                                    required
                                    delay="0.1s"
                                />
                                <FormInput
                                    label="Google Scholar ID *"
                                    value={form.gsId}
                                    onChange={e => setForm({ ...form, gsId: e.target.value })}
                                    required
                                    delay="0.1s"
                                />
                                <FormInput
                                    label="Researcher First Name (Optional)"
                                    value={form.firstname}
                                    onChange={e => setForm({ ...form, firstname: e.target.value })}
                                    required
                                    delay="0.15s"
                                />
                                <FormInput
                                    label="Researcher Last Name (Optional)"
                                    value={form.lastname}
                                    onChange={e => setForm({ ...form, lastname: e.target.value })}
                                    required
                                    delay="0.2s"
                                />
                                <FormInput
                                    label="ORCID (Optional)"
                                    value={form.orcid}
                                    onChange={e => setForm({ ...form, orcid: e.target.value })}
                                    delay="0.25s"
                                />
                                <FormInput
                                    label="Administrative Notes"
                                    isTextArea
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    delay="0.3s"
                                />

                                <AuthButton
                                    loading={status.loading}
                                    text="Register Researcher"
                                    loadingText="Syncing with GS..."
                                    delay="0.4s"
                                />

                                {status.error && (
                                    <div className={`auth-message auth-error ${status.errorCount <= 1 ? "first-reveal" : "re-shake"}`}>
                                        <div className="status-indicator"></div>
                                        <i className="fa-solid fa-circle-exclamation"></i>
                                        <span className="error-text">{status.error}</span>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SuccessPopup
                isOpen={status.success}
                onClose={handleSuccessClose}
                message="Faculty Member Added!"
                submessage="The system is now crawling the data. They will appear in the directory shortly."
            />
        </>
    );
};

export default AddUserModal;