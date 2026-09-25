import React from "react";
import {Route, Routes, Navigate, useLocation} from "react-router-dom";
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import Login from './layouts/login.jsx';
import LandingPage from "./layouts/landing.jsx";
import Register from "./layouts/register.jsx";
import ProtectedRoute from "./components/protected_route";
import DashboardLayout from "./layouts/dashboard.jsx";
import FindAusme from "./layouts/find_ausme.jsx";
import Profile from "./layouts/profile.jsx";
import FeedbackTab from "./components/feedback/login_feedback.jsx";
import SessionTimeoutModal from "./components/SessionTimeoutModal.jsx";
import Paper from "./layouts/paper.jsx";
import Opportunities from "./layouts/opportunities.jsx";
import UserDashboard from "./layouts/user_dashboard.jsx"
import About from './layouts/about.jsx'
import AdminControl from "./layouts/admin_control.jsx";

const FeedbackController = () => {
    const location = useLocation();
    const isDashboardPath = location.pathname.startsWith("/internal/dashboard");
    if (!isDashboardPath) return null;
    return <FeedbackTab/>;
};

function PrivateApp() {
    return (
        <>
            <SessionTimeoutModal/>
            <FeedbackController/>

            <Routes>
                <Route index element={<LandingPage viewType="private"/>}/>

                <Route path="login" element={<Login/>}/>

                <Route
                    path="register"
                    element={
                        <ProtectedRoute>
                            <Register/>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout viewType="private"/>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<UserDashboard viewType="private"/>}/>
                    <Route path="admin_control" element={<AdminControl/>}/>
                    <Route path="profile/:auid" element={<Profile viewType="private"/>}/>
                    <Route path="papers" element={<Paper viewType="private"/>}/>
                    <Route path="find_ausme" element={<FindAusme viewType="private"/>}/>
                    <Route path="opportunities" element={<Opportunities viewType="private"/>}/>
                    <Route path="about" element={<About/>}/>
                </Route>

                <Route
                    path="inspect/dashboard/:targetAuid"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <DashboardLayout viewType="inspect"/>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<UserDashboard viewType="inspect"/>}/>
                    <Route path="admin_control" element={<AdminControl viewType="inspect"/>}/>
                    <Route path="profile/:auid" element={<Profile viewType="inspect"/>}/>
                    <Route path="papers" element={<Paper viewType="inspect"/>}/>
                    <Route path="find_ausme" element={<FindAusme viewType="inspect"/>}/>
                    <Route path="opportunities" element={<Opportunities viewType="inspect"/>}/>
                    <Route path="about" element={<About/>}/>
                </Route>

                <Route path="*" element={<Navigate to="/internal" replace/>}/>
            </Routes>

            <ReactQueryDevtools initialIsOpen={false}/>
        </>
    );
}

export default PrivateApp;