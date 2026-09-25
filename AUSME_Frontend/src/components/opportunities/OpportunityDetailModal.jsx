import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavoriteOpp } from '../../services/opp';
import { useToggleOppFavorite } from '../../hooks/useToggleOppFavorite';

const agencyLogos = import.meta.glob('../../assets/agencies/*.png', { eager: true });

const OpportunityDetailModal = ({ opportunity, onClose, effectiveAuid, bookmarksMode, onLocalOppPatch }) => {
    const [activeTab, setActiveTab] = useState('description');
    if (!opportunity) return null;

    const queryClient = useQueryClient();

  const mutation = useToggleOppFavorite({
      effectiveAuid,
      oppId: opportunity?.opp_id,
      bookmarksMode,
      getIsFavorite: () => opportunity?.is_favorite,
      onLocalOppPatch,
    });

    const getAgencyLogo = (name) => {
        const defaultLogo = agencyLogos['../../assets/agencies/default-logo.png']?.default;
        const logoPath = Object.keys(agencyLogos).find(path =>
            path.toUpperCase().includes(name?.toUpperCase())
        );
        return logoPath ? agencyLogos[logoPath].default : defaultLogo;
    };

    const formatCurrency = (val) => {
        if (!val || val === 0) return 'TBD';
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 0
        }).format(val);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const grantsGovUrl = opportunity?.opp_id
          ? `https://www.grants.gov/search-results-detail/${encodeURIComponent(opportunity.opp_id)}`
          : null;

    return (
        <div className="detail-modal-overlay" onClick={onClose}>
            <div className="detail-modal-content reveal-animation" onClick={(e) => e.stopPropagation()}>

                <div className="modal-top-hero">
                    <div className="modal-agency-logo">
                        <img src={getAgencyLogo(opportunity.parent_agency_name)} alt="Agency" />
                    </div>
                    <div className="modal-title-container">
                        <h2 className="modal-primary-title">{opportunity.title}</h2>
                        <span className="modal-agency-subtitle">{opportunity.agency_name}</span>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-scroll-area">
                    <div className="modal-specs-grid">
                        <div className="spec-box-inline">
                            <span className="s-label"><i className="fas fa-sack-dollar"></i> Funding:</span>
                            <span className="s-value">{formatCurrency(opportunity.estimated_funding)}</span>
                        </div>
                        <div className="spec-box-inline">
                            <span className="s-label"><i className="fas fa-calendar-alt"></i> Expires:</span>
                            <span className="s-value">{formatDate(opportunity.due_date)}</span>
                        </div>
                        <div className="spec-box-inline">
                            <span className="s-label"><i className="fas fa-clock"></i> Posted:</span>
                            <span className="s-value">{formatDate(opportunity.post_date)}</span>
                        </div>
                        <div className="spec-box-inline">
                            <span className="s-label"><i className="fas fa-check-circle"></i> Status:</span>
                            <span className="s-value status-text">{opportunity.statuses?.[0] || 'Active'}</span>
                        </div>
                    </div>

                    <div className="modal-tab-container">
                        <button
                            className={`modal-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`modal-tab-btn ${activeTab === 'eligibility' ? 'active' : ''}`}
                            onClick={() => setActiveTab('eligibility')}
                        >
                            Eligibility
                        </button>
                        <button
                            className={`modal-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contact')}
                        >
                            Contact
                        </button>
                    </div>

                    <div className="modal-tab-content">
                        {activeTab === 'description' &&
                            <div className="modal-description-section">
                                <h4 className="section-label">Detailed Description</h4>
                                {/* Rendering the HTML directly with a scoped wrapper */}
                                <div
                                    className="description-text-wrapper agency-html-content"
                                    dangerouslySetInnerHTML={{ __html: opportunity.description || "No detailed description provided." }}
                                />
                                {/* Keywords Section */}
                                <div className="modal-keywords-section">
                                    <h4 className="section-label">Research Keywords</h4>
                                    <div className="k-pill-box">
                                        {opportunity.topics?.map((t, i) => (
                                            <span key={i} className="k-pill">#{t.topic}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        }
                        {activeTab === 'eligibility' &&
                            <div className="modal-eligibility-content">
                                {/* Applicant Types Section */}
                                {opportunity.applicant_types && opportunity.applicant_types.length > 0 && (
                                    <div className="modal-keywords-section" style={{marginBottom: '30px'}}>
                                        <h4 className="section-label">Applicant Eligibility</h4>
                                        <div className="k-pill-box">
                                            {[...opportunity.applicant_types].reverse().map((type, i) => (
                                                <span key={i} className="k-pill">{type}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/*Opportunity's additional eligibility info*/}
                                {opportunity.eligibility_text && (
                                <div className="modal-eligibility-section">
                                    <h4 className="section-label">Additional Eligibility Info</h4>
                                    {/* Rendering the HTML directly with a scoped wrapper */}
                                    <div
                                        className="eligibility-text-wrapper agency-html-content"
                                        dangerouslySetInnerHTML={{ __html: opportunity.eligibility_text || "No eligibility provided." }}
                                    />
                                </div>)}
                            </div>
                        }
                        {activeTab === 'contact' && (
                            <div className="modal-contact-content">
                                {opportunity.contact ? (
                                    <div className="contact-card-block">
                                        <h4 className="section-label">Program Contact</h4>
                                        <div className="contact-info-grid">
                                            {opportunity.contact.contact_name && (
                                                <div className="contact-info-row">
                                                    <span className="contact-icon-label"><i className="fas fa-user"></i> Name</span>
                                                    <span className="contact-info-value">{opportunity.contact.contact_name}</span>
                                                </div>
                                            )}
                                            {opportunity.contact.contact_email && (
                                                <div className="contact-info-row">
                                                    <span className="contact-icon-label"><i className="fas fa-envelope"></i> Email</span>
                                                    <a className="contact-link" href={`mailto:${opportunity.contact.contact_email}`}>
                                                        {opportunity.contact.contact_email}
                                                    </a>
                                                </div>
                                            )}
                                            {opportunity.contact.contact_phone && (
                                                <div className="contact-info-row">
                                                    <span className="contact-icon-label"><i className="fas fa-phone"></i> Phone</span>
                                                    <span className="contact-info-value">{opportunity.contact.contact_phone}</span>
                                                </div>
                                            )}
                                            {opportunity.contact.agency_phone && opportunity.contact.agency_phone !== opportunity.contact.contact_phone && (
                                                <div className="contact-info-row">
                                                    <span className="contact-icon-label"><i className="fas fa-building"></i> Agency Phone</span>
                                                    <span className="contact-info-value">{opportunity.contact.agency_phone}</span>
                                                </div>
                                            )}
                                            {opportunity.contact.contact_desc && (
                                                <div className="contact-info-row">
                                                    <span className="contact-icon-label"><i className="fas fa-info-circle"></i> Notes</span>
                                                    <span className="contact-info-value muted">{opportunity.contact.contact_desc}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-contact-state">
                                        <p>No contact information available for this opportunity.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                <div className="modal-footer-actions">
                    <button className="btn-form-team-formal" onClick={() => console.log('Form Team')}>
                        <i className="fas fa-users"></i> Form Team
                    </button>
                    <a className="view-grants-btn" href={grantsGovUrl} target="_blank" rel="noopener noreferrer">
                        <span>View on Grants.Gov</span>
                        <span className="external-icon" aria-hidden="true">↗</span>
                    </a>
                    <button
                      className={`btn-fav-formal ${opportunity.is_favorite ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (effectiveAuid && !mutation.isPending) mutation.mutate();
                      }}
                    >
                      <i className={`${opportunity.is_favorite ? 'fas' : 'far'} fa-bookmark`}></i>
                      <span>{opportunity.is_favorite ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpportunityDetailModal;