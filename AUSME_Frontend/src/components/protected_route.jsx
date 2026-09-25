import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '../services/session.js';

const ProtectedRoute = ({ children }) => {
    const token = getAccessToken();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/internal/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;