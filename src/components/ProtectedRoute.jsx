import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    // 1. Get user data from localStorage
    const storedUser = localStorage.getItem('auth_user');

    // 2. Check if user exists
    if (!storedUser) {
        // If not logged in, redirect to Landing Page
        return <Navigate to="/" replace />;
    }

    try {
        const user = JSON.parse(storedUser);

        // 3. Check if role is allowed (if allowedRoles is provided)
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // If logged in but wrong role, redirect to Landing Page (or unauthorized page)
            // For now, let's kick them out or redirect to their respective dashboard?
            // Safer to just kick to root to avoid loops.
            return <Navigate to="/" replace />;
        }

        // 4. If all checks pass, render child routes
        return <Outlet />;

    } catch (error) {
        // If JSON parse fails, clear storage and redirect
        localStorage.removeItem('auth_user');
        return <Navigate to="/" replace />;
    }
};

export default ProtectedRoute;
