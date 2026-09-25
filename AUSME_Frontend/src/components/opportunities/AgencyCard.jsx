import React from 'react';

const agencyLogos = import.meta.glob('../../assets/agencies/*.png', { eager: true });

const AgencyCard = ({ agency, onViewOpportunities }) => {
    const getLogo = (name, parentName) => {
        const targetName = parentName || name;
        const defaultLogo = agencyLogos['../../assets/agencies/default-logo.png']?.default;

        if (!targetName) return defaultLogo;

        const logoPath = Object.keys(agencyLogos).find(path =>
            path.toUpperCase().includes(targetName.toUpperCase())
        );
        return logoPath ? agencyLogos[logoPath].default : defaultLogo;
    };

    const logoSrc = getLogo(agency.name, agency.parent_name);

    return (
        <div className="agency-card reveal-animation">
            {/* The Badge */}
            <div className="vertical-badge">
                <span className="badge-label">OPPS</span>
                <span className="badge-number">{agency.open_opportunities}</span>
            </div>

            {/* 3D Logo Section */}
            <div className="agency-logo-container">
                <div className="logo-3d-base">
                    <div className="logo-inner-shadow">
                        <img
                            src={logoSrc}
                            alt={agency.name}
                            className="agency-main-logo"
                            onError={(e) => {
                                e.target.src = agencyLogos['../../assets/agencies/default-logo.png']?.default;
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="agency-content">
                <h3 className="agency-name">{agency.name}</h3>
                {agency.parent_name && (
                    <div className="parent-agency-label">
                        {agency.parent_name}
                    </div>
                )}
            </div>

            <div className="agency-card-footer">
                <button className="explore-btn-premium" onClick={onViewOpportunities}>
                    <span className="btn-text">Explore Opportunities</span>
                    <span className="btn-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    );
};

export default AgencyCard;