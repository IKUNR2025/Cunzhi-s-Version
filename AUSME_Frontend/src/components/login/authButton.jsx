import React, { useState } from "react";

const AuthButton = ({ loading, text, loadingText, delay }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <button
            type="submit"
            className={`login-btn fade-up ${loading ? "btn-loading" : ""}`}
            style={{ "--delay": delay }}
            disabled={loading}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {loading ? (
                <>
                    <i className="fa-solid fa-spinner fa-spin btn-icon-loading"></i>
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    <span>{text}</span>
                    <i className="fa-solid fa-arrow-right btn-icon"
                       style={{ transform: isHovering ? "translateX(5px)" : "translateX(0)" }} />
                </>
            )}
        </button>
    );
};

export default AuthButton;