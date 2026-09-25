import React, {useEffect, useState} from "react";
import "../styles/login.css";
import {registerResearcher} from "../services/session.js";
import FormInput from "../components/login/FormInput.jsx";
import AuthButton from "../components/login/authButton.jsx";
import SuccessPopup from "../components/login/SuccessPopup.jsx";
import { useNavigate } from "react-router-dom";

function Register() {
    const [form, setForm] = useState({gsId: "", firstname: "", lastname: "", orcid: "", reason: ""});
    const [status, setStatus] = useState({
        loading: false,
        error: null,
        success: false,
        errorCount: 0
    });

        useEffect(() => {
        document.body.classList.add("login-body");

        return () => {
            document.body.classList.remove("login-body");
        };
    }, []);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(prev => ({...prev, loading: true, error: null}));

        try {
            const data = await registerResearcher({
                gs_id: form.gsId,
                first_name: form.firstname,
                last_name: form.lastname,
                orcid_id: form.orcid,
                reason: form.reason
            });

            if (data.success) {
                setStatus(prev => ({...prev, success: true, loading: false}));
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

    return (
        <div className="login-container">
            <div className="login_items">
                <img
                    src="https://ecm.eng.auburn.edu/images/find-expert-ai.png"
                    className="logo fade-up"
                    style={{"--delay": "0.1s"}}
                    alt="Logo"
                />

                <div className="login-card">
                    <div className="card-header">
                        <div className="accent-line"></div>
                        <h2 className="fade-up" style={{"--delay": "0.2s"}}>Create Your Profile</h2>
                        <p className="fade-up" style={{"--delay": "0.3s"}}>
                            Provide your <span className="highlight-text">research identifiers</span> to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <FormInput
                            label="Google Scholar ID *"
                            value={form.gsId}
                            onChange={e => setForm({...form, gsId: e.target.value})}
                            delay="0.1s"
                            required
                        />
                        <FormInput
                            label="ORCID (Optional)"
                            value={form.orcid}
                            onChange={e => setForm({...form, orcid: e.target.value})}
                            delay="0.25s"
                        />
                        <FormInput
                            label="Reason for access"
                            isTextArea
                            value={form.reason}
                            onChange={e => setForm({...form, reason: e.target.value})}
                            delay="0.3s"
                        />

                        <AuthButton
                            loading={status.loading}
                            text="Submit Profile"
                            loadingText="Processing..."
                            delay="0.7s"
                        />

                        {status.error && (
                            <div
                                className={`auth-message auth-error ${status.errorCount <= 1 ? "first-reveal" : "re-shake"}`}>
                                <div className="status-indicator"></div>
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span className="error-text">{status.error}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <SuccessPopup
                isOpen={status.success}
                onClose={() => navigate("/internal/login")}
                message="We received your information successfully!"
                submessage="Our team will review your request and get back to you soon."
            />
        </div>
    );
}

export default Register;