import React, {useEffect, useState} from "react";
import "../styles/login.css";
import {loginUser} from "../services/session.js";
import {useNavigate} from "react-router-dom";
import FormInput from "../components/login/FormInput.jsx";
import AuthButton from "../components/login/authButton.jsx";
import SuccessPopup from "../components/login/SuccessPopup.jsx";
import auLogo from '../assets/logo/au.png';

function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add("login-body");
        return () => {
            document.body.classList.remove("login-body");
        };
    }, []);

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [status, setStatus] = useState({
        loading: false,
        error: null,
        errorCount: 0,
    });

    const [popup, setPopup] = useState({
        isOpen: false,
        data: null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(prev => ({...prev, loading: true, error: null}));

        try {
            const data = await loginUser({
                username: form.username,
                password: form.password
            });

            if (data.requires_registration) {
                return navigate("/internal/register");
            }

            if (data.registration_info) {
                setStatus(prev => ({...prev, loading: false}));
                setPopup({
                    isOpen: true,
                    data: data.registration_info
                });
                return;
            }

            localStorage.setItem("user", JSON.stringify({
                role: data.user_type,
                username: form.username
            }));

            navigate("/internal/dashboard");

        } catch (err) {
            setStatus(prev => ({
                error: err.message,
                errorCount: prev.errorCount + 1,
                loading: false
            }));
        }
    };

    const handlePopupClose = () => {
        setPopup({isOpen: false, data: null});
    };

    return (
        <div className="login-container">
            <div className="login_items">
                <img
                    src={auLogo}
                    className="logo fade-up"
                    style={{"--delay": "0.1s"}}
                    alt="Logo"
                />

                <div className="login-card">
                    <div className="card-header">
                        <div className="accent-line"></div>
                        <h2 className="fade-up" style={{"--delay": "0.2s"}}>
                            Welcome to AUSME Internal
                        </h2>
                        <p className="fade-up credential-text" style={{"--delay": "0.3s"}}>
                            Use your <span className="highlight-text">Auburn University</span> credentials to login
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <FormInput
                            label="Username"
                            value={form.username}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    username: e.target.value,
                                })
                            }
                            delay="0.4s"
                            required
                        />

                        <FormInput
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    password: e.target.value,
                                })
                            }
                            delay="0.5s"
                            required
                        />

                        <AuthButton
                            loading={status.loading}
                            text="Login"
                            loadingText="Authenticating..."
                            delay="0.6s"
                        />

                        <div className="error-container">
                            {status.error && (
                                <div
                                    className={`auth-message auth-error ${
                                        status.errorCount <= 1
                                            ? "first-reveal"
                                            : "re-shake"
                                    }`}
                                >
                                    <div className="status-login_indicator"></div>
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    <span className="error-text">
                                        {status.error}
                                    </span>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {popup.data && (
                <SuccessPopup
                    isOpen={popup.isOpen}
                    onClose={handlePopupClose}
                    title="Registration Found"
                    message={
                        <span>
                            Hello{" "}
                            <span className="highlight-text">
                                {popup.data.first_name}
                            </span>
                            , your application is already in our system.
                        </span>
                    }
                    submessage={
                        <div className="registration-details-list">
                            <div className="detail-item">
                                <strong>Status: </strong>
                                <span className={`status-badge-colored ${popup.data.status}`}>
                                    {popup.data.status}
                                </span>
                            </div>
                            <div className="detail-item">
                                <strong>Submitted: </strong>
                                <span className="highlight-value">
                                    {popup.data.submitted_at.split(" ")[0]}
                                </span>
                            </div>
                        </div>
                    }
                />
            )}
        </div>
    );
}

export default Login;