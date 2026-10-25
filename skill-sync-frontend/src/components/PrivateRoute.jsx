import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * PrivateRoute component to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;
