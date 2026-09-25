import React, { useState } from "react";

const FormInput = ({ label, type = "text", value, onChange, required, delay, isTextArea, icon }) => {
    const [isActive, setIsActive] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputProps = {
        placeholder: " ",
        className: `form-input ${isActive ? "active" : ""}`,
        value,
        onChange,
        onFocus: () => setIsActive(true),
        onBlur: () => setIsActive(false),
        required
    };

    return (
        <div className="input-group fade-up" style={{ "--delay": delay }}>
            <div className="input-container">
                {isTextArea ? (
                    <textarea {...inputProps} rows="4" style={{ resize: 'none' }} />
                ) : (
                    <input {...inputProps} type={type === "password" && showPassword ? "text" : type} />
                )}
                <label className="input-label">{label}</label>
                <div className="input-underline"></div>

                {type === "password" && (
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default FormInput;