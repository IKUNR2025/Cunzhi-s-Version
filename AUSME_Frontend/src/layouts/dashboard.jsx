import React, {useState, useMemo} from 'react';
import {Outlet, useParams, useLocation} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useQuery} from '@tanstack/react-query';
import Sidebar from '../components/dashboard/sidebar.jsx';
import '../styles/dashboard/dashboard_layout.css';
import {get_user_role} from "../services/user";

const DashboardLayout = ({viewType}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const {targetAuid} = useParams();
    const location = useLocation();

    const realUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch (e) {
            return null;
        }
    }, []);

    const {data: info} = useQuery({
        queryKey: ['userRole', targetAuid],
        queryFn: () => get_user_role(targetAuid),
        enabled: viewType === 'inspect' && !!targetAuid,
    });

    let displayUser;
    if (viewType === 'inspect') {
        displayUser = {
            username: targetAuid,
            role: info?.role || 'researcher'
        };
    } else {
        displayUser = realUser;
    }

    const layoutTransition = {
        type: "tween",
        ease: [0.4, 0, 0.2, 1],
        duration: 0.5
    };

    return (
        <div className="dashboard-layout-container">
            <Sidebar
                user_info={displayUser}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                viewType={viewType}
                targetAuid={targetAuid}
            />

            <motion.main
                className={`main-content ${isCollapsed ? 'collapsed' : ''}`}
                onClick={() => {
                    if (!isCollapsed && window.innerWidth <= 768) setIsCollapsed(true);
                }}
                animate={{
                    marginLeft: isCollapsed ? 85 : 280,
                    width: `calc(100% - ${isCollapsed ? 85 : 280}px)`
                }}
                transition={layoutTransition}
            >
                <div className="content-padding">

                    <Outlet context={{
                        viewType,
                        targetAuid,
                        realUser
                    }}/>
                </div>
            </motion.main>
        </div>
    );
};

export default DashboardLayout;