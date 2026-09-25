import React from "react";

const SuccessPopup = ({ isOpen, onClose, title, message, submessage }) => {
    if (!isOpen) return null;

    return (
        <div className="popupOverlay popupOverlayActive">
            <div className="popupAnimationContainer">
                {/* 15 Particles for a better scatter effect */}
                {[...Array(15)].map((_, i) => (
                    <div key={i} className={`particle p${i + 1}`}></div>
                ))}

                <div className="popupContent">
                    <div className="successIcon">
                        <svg viewBox="0 0 100 100">
                            <circle className="circle" cx="50" cy="50" r="45" />
                            <polyline className="check" points="25,55 45,75 75,35" />
                        </svg>
                    </div>
                    <h2 className="popupTitle">{title || "Success!"}</h2>
                    <div className="popupMessage">{message}</div>
                    <div className="popupSubmessage">{submessage}</div>
                    <button className="popupOkBtn" onClick={onClose}>
                        Okay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessPopup;