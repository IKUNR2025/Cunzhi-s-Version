import React, {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCalendarAlt, faChevronRight, faArrowRight, faMicrochip} from '@fortawesome/free-solid-svg-icons';
import {fetchOpenOpportunities} from '../../services/opp.js';
import OpportunityDetailModal from '../opportunities/OpportunityDetailModal.jsx';
import {toggleFavoriteOpp} from '../../services/opp';
import '../../styles/opportunities/Opportunities.css';
import OpportunityCard from "./OpportunityCard.jsx";

const agencyLogos = import.meta.glob('../../assets/agencies/*.png', {eager: true});

const getAgencyLogo = (name) => {
    const defaultLogo = agencyLogos['../../assets/agencies/default-logo.png']?.default;
    if (!name) return defaultLogo;
    const logoPath = Object.keys(agencyLogos).find(path =>
        path.toUpperCase().includes(name.toUpperCase())
    );
    return logoPath ? agencyLogos[logoPath].default : defaultLogo;
};

const RecommendedOpportunities = ({effectiveAuid, currentAgencyId, viewType, targetAuid}) => {
    const navigate = useNavigate();
    const [selectedOpp, setSelectedOpp] = useState(null);

    const {
        data: oppsData,
        isLoading: oppsLoading
    } = useInfiniteQuery({
        queryKey: ['opportunities', effectiveAuid],
        queryFn: (ctx) => fetchOpenOpportunities({
            ...ctx,
            filters: {
                agencyId: currentAgencyId,
                recommendMode: true,
                auid: effectiveAuid
            }
        }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.next || null,
        enabled: !!effectiveAuid,
    });

    const allMatches = useMemo(() => {
        const flattened = oppsData?.pages.flatMap(page => page.results) || [];
        return [...flattened]
            .sort((a, b) => {
                const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                return dateA - dateB;
            })
            .slice(0, 5);
    }, [oppsData]);

    const getTargetUrl = () => {
        return viewType === 'inspect'
            ? `/internal/inspect/dashboard/${targetAuid}/opportunities`
            : `/internal/dashboard/opportunities`;
    };

    const handleNavigate = (match) => {
        navigate(getTargetUrl(), {
            state: {autoOpenOpp: match}
        });
    };

    const IntelligenceLoader = () => (
        <div className="intelligence-loading-container">
            <div className="ai-brain-pulse">
                <FontAwesomeIcon icon={faMicrochip}/>
                <div className="pulse-wave"></div>
            </div>
            <span className="ai-loading-status">Analyzing Intelligence...</span>
        </div>
    );

    return (
        <section className="dashboard-section drawer-stack-section formal-3d-box">
            <div className="compact-section-header">
                <div className="header-left-aligned">
                    <div className="ranking-title-container">
                        <span className="static-top-text">Top</span>
                        {!oppsLoading && (
                            <span className="dynamic-number-callout">
                                {allMatches.length}
                            </span>
                        )}
                        <h3 className="clean-title-suffix">Funding Suggestions</h3>
                    </div>
                </div>

                {!oppsLoading && (
                    <button className="premium-explore-link" onClick={() => navigate(getTargetUrl())}>
                        <span className="btn_text">Explore All</span>
                        <div className="arrow-circle">
                            <FontAwesomeIcon icon={faArrowRight}/>
                        </div>
                    </button>
                )}
            </div>

            <div className="drawer-viewport">
                {oppsLoading ? (
                    <IntelligenceLoader/>
                ) : (
                    <div className="visible-card-stack">
                        {allMatches.map((match, idx) => (
                                <OpportunityCard
                                    key={match.opp_id}
                                    opportunity={match}
                                    onReadMore={setSelectedOpp}
                                    effectiveAuid={effectiveAuid}
                                    formTeamBtn={false}
                                />
                            )
                        )}
                    </div>
                )}
            </div>
            {selectedOpp && (
                <OpportunityDetailModal
                  opportunity={selectedOpp}
                  onClose={() => setSelectedOpp(null)}
                  effectiveAuid={effectiveAuid}
                  bookmarksMode={false}
                  onLocalOppPatch={(patch) =>
                        setSelectedOpp(prev => (prev ? { ...prev, ...patch } : prev))
                    }
                />
              )}
        </section>
    );
};

export default RecommendedOpportunities;