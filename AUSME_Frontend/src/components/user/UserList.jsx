import React, { useState, useEffect, useRef, useCallback } from 'react';
import UserCard from './UserCard';
import '../../styles/user/user_list.css';

const UserList = ({
    items,
    itemsPerPage = 8,
    onViewProfile,
    isSearchResult = false,
    isAdminMode = false,
    onToggleStatus = null,
    canInspect = false
}) => {
    const [visibleCount, setVisibleCount] = useState(itemsPerPage);
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < items.length) {
                setTimeout(() => {
                    setVisibleCount(prevCount => prevCount + itemsPerPage);
                }, 100);
            }
        });

        if (node) observer.current.observe(node);
    }, [items.length, visibleCount, itemsPerPage]);

    const visibleItems = items.slice(0, visibleCount);

    return (
        <div className="user-list-wrapper">
            <div className="cards-grid-container">
                {visibleItems.map((res) => (
                    <UserCard
                        key={res.faculty_id}
                        profile={{
                            ...res,
                            google_scholar_url: res.google_scholar_url || "#"
                        }}
                        mode={isSearchResult ? "result" : "standard"}
                        matchedTitles={res.matched_research || []}
                        isAdminMode={isAdminMode}
                        onToggleStatus={onToggleStatus}
                        canInspect={canInspect}
                        onViewProfile={() => onViewProfile(res.faculty_id)}
                    />
                ))}
            </div>

            {visibleCount < items.length && (
                <div ref={lastElementRef} className="loading-trigger">
                    <div className="spinner-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <p>Loading more researchers...</p>
                </div>
            )}
        </div>
    );
};

export default UserList;