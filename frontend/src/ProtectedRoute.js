import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';


const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  let location = useLocation();

  if (!token) {
    // Redirect to the sign-in page
    return <Navigate to="/signin" state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
