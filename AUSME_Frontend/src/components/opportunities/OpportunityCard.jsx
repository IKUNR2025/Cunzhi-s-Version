import React from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {toggleFavoriteOpp} from '../../services/opp';

const agencyLogos = import.meta.glob('../../assets/agencies/*.png', {eager: true});

const OpportunityCard = ({opportunity, onReadMore, effectiveAuid, bookmarksMode, formTeamBtn}) => {
    const queryClient = useQueryClient();

     const mutation = useMutation({
        mutationFn: () => toggleFavoriteOpp(effectiveAuid, opportunity.opp_id),
        onMutate: async () => {
            // 1. Cancel any outgoing refetches
            await queryClient.cancelQueries({queryKey: ['opportunities']});

            // 2. Snapshot the current cache state
            const previousQueries = queryClient.getQueriesData({queryKey: ['opportunities']});

            // 3. Optimistically update the cache
            queryClient.setQueriesData({queryKey: ['opportunities']}, oldData => {
                if (!oldData || !oldData.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => {
                        // Toggle the favorite status for the specific opportunity
                        let updatedResults = page.results.map(opt =>
                            opt.opp_id === opportunity.opp_id
                                ? {...opt, is_favorite: !opt.is_favorite}
                                : opt
                        );

                        // FIX: If we are in "Bookmarks Mode" and just unbookmarked,
                        // remove the item from the list immediately for a snappy UI.
                        if (bookmarksMode && opportunity.is_favorite) {
                            updatedResults = updatedResults.filter(opt => opt.opp_id !== opportunity.opp_id);
                        }

                        return {
                            ...page,
                            results: updatedResults
                        };
                    })
                };
            });

            return {previousQueries};
        },
        onError: (err, newItem, context) => {
            // Rollback on error
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, value]) => {
                    queryClient.setQueryData(queryKey, value);
                });
            }
        },
        onSettled: () => {
            // Sync with server in the background
            queryClient.invalidateQueries({
                queryKey: ['opportunities'],
                refetchType: 'none'
            });
        },
    });

    const getAgencyLogo = (name) => {
        const defaultLogo = agencyLogos['../../assets/agencies/default-logo.png']?.default;
        if (!name) return defaultLogo;
        const logoPath = Object.keys(agencyLogos).find(path =>
            path.toUpperCase().includes(name.toUpperCase())
        );
        return logoPath ? agencyLogos[logoPath].default : defaultLogo;
    };

    const logoSrc = getAgencyLogo(opportunity.parent_agency_name);

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

    const charLimit = 125;
        if (opportunity.title.length > charLimit) {
            opportunity.title =  opportunity.title.substring(0, charLimit) + "...";
        }

    return (
        <div className="opportunity-card-formal reveal-animation">
            <div className="floating-logo-edge">
                <img
                    src={logoSrc}
                    alt="Agency"
                    onError={(e) => {
                        e.target.src = agencyLogos['../../assets/agencies/default-logo.png']?.default;
                    }}
                />
            </div>

            <div className="card-inner-container" >
                <div className="title-block-hero" onClick={() => onReadMore(opportunity)}>
                    <h3 className="formal-title-full" >
                        {opportunity.title}
                    </h3>
                    <div className="agency-minimal-label">{opportunity.agency_name}</div>
                </div>

                <div className="specs-grid-boxes" onClick={() => onReadMore(opportunity)}>
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

                <div className="orange-divider-line" onClick={() => onReadMore(opportunity)}></div>


                <div className="keywords-container" onClick={() => onReadMore(opportunity)}>
                    <span className="k-header">Keywords:</span>
                    <div className="k-pill-box">
                        {opportunity.topics?.slice(0, 4).map((t, i) => (
                            <span key={i} className="k-pill">{t.topic}</span>
                        ))}
                    </div>
                </div>

                <div className="footer-flush-left">
                    <div className="footer-main-actions">
                        <button className="btn-read-more-formal" onClick={() => onReadMore(opportunity)}>
                            <i className="fas fa-eye"></i> Read More
                        </button>
                        {formTeamBtn && (<button className="btn-form-team-formal" onClick={() => console.log('Form Team')}>
                            <i className="fas fa-users"></i> Form Team
                        </button>)}
                    </div>

                    <button
                        className={`btn-fav-formal ${opportunity.is_favorite ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (effectiveAuid && !mutation.isPending) {
                                mutation.mutate();
                            }
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

export default OpportunityCard;