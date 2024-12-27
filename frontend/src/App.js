import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import UpdateProfile from './components/UpdateProfile';
import AdminDashboard from './components/AdminDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Subscription from './components/Subscription';
import Payment from './components/Payment';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import config from './config';
import ErrorBoundary from './components/ErrorBoundary';

// Configure axios defaults
axios.defaults.baseURL = config.API_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Add axios interceptor for auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('verve_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Stripe appearance options
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#4158D0',
  },
};

const options = {
  appearance,
  mode: 'subscription',
  currency: 'usd',
};

function HomePage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');

  const handleTryForFree = (e) => {
    e.preventDefault();
    navigate('/signup', { state: { email } });
  };

  return (
    <div className="main-content">
      <div className="hero-text">
        <h1 className="hero-title">Exploring the Future of Tech</h1>
        <h2 className="hero-subtitle">Your Weekly Dive into AI Innovation and Trends</h2>
        <p className="hero-description">Education, Analysis, Community Support</p>
        
        <div className="email-container">
          <input
            type="email"
            className="email-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="try-free-btn" onClick={handleTryForFree}>
            Try for FREE!
          </button>
        </div>
        
        <p className="trust-text">Trusted by IT Professionals Worldwide</p>
      </div>
      <div className="preview-card">
        {/* This div will be styled to match the Stripe layout but keep your content */}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-100">
              <nav className="navbar">
                <div className="nav-left">
                  <Link to="/" className="nav-link">Home</Link>
                  <Link to="/subscription" className="nav-link">Subscribe</Link>
                  <Link to="/about" className="nav-link">About Us</Link>
                </div>
                <div className="nav-right">
                  <Link to="/signin" className="nav-link sign-in-btn">Sign In</Link>
                  <Link to="/signup" className="nav-link sign-up-btn">Sign Up</Link>
                </div>
              </nav>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<UpdateProfile />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route 
                    path="/payment" 
                    element={
                      <Elements stripe={stripePromise} options={options}>
                        <Payment />
                      </Elements>
                    } 
                  />
                </Route>

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
