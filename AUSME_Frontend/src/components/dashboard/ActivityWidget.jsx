import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../services/session';

const ActivityWidget = () => {
    const [activities, setActivities] = useState([]);
    const navigate = useNavigate();

    const fetchActivities = async () => {
        try {
            // Your Django endpoint we created earlier
            const res = await authFetch('http://131.204.110.49:8800/api/analytics/recent/');
            const data = await res.json();
            setActivities(data);
        } catch (err) {
            console.error("Activity Fetch Error:", err);
        }
    };

    useEffect(() => {
        fetchActivities();
        // Refresh every 5 seconds so you can see your tests live
        const interval = setInterval(fetchActivities, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="activity-panel" style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #edf2f7'
        }}>
            <h3 style={{
                fontSize: '1.1rem',
                color: '#03244d',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <i className="fas fa-history" style={{ color: '#f66733' }}></i>
                Recent Activity
            </h3>

            <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: '#a0aec0' }}>No recent actions found.</p>
                ) : (
                    activities.map((act) => (
                        <div
                            key={act.id}
                            onClick={() => act.target_url && navigate(act.target_url)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                borderLeft: `4px solid ${act.action_type === 'click' ? '#f66733' : '#03244d'}`,
                                background: '#f8fafc',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
                        >
                            <div style={{flex: 1}}>
                                <p style={{margin: 0, fontSize: '0.85rem', fontWeight: '500', color: '#2d3748'}}>
                                    {act.action_type === 'search' ? (
                                        <span>Performed Search</span>
                                    ) : (
                                        <span>Selected <strong>{act.target_name}</strong></span>
                                    )}
                                </p>
                                <span style={{fontSize: '0.7rem', color: '#718096'}}>
        {act.action_type === 'search' ? act.target_name : act.location_tag}
    </span>
                            </div>
                            <i className="fas fa-chevron-right" style={{fontSize: '0.7rem', color: '#cbd5e0'}}></i>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityWidget;