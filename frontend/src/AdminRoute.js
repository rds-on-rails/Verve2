import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import config from './config';

const AdminRoute = ({ children }) => {
  const { authData } = useAuth();
  const location = useLocation();

  if (!authData?.token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (authData?.user?.role !== config.ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
