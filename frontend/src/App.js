// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard'; // Your protected component

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <div className="bg-black text-white h-screen flex flex-col items-center justify-center">
              <h1 className="text-5xl font-bold mb-4">Exploring the Future of Tech</h1>
              
              <h3 style={{ fontWeight: 'bold', backgroundColor: 'light-blue' }}>Your Weekly Dive into AI Innovation and Trends.</h3>
              <p className="text-xl mb-4">Education, Analysis, Community Support.</p>
              <form className="flex flex-col items-center">
                <input
                  type="email"
                  placeholder="Email address"
                  className="text-black mb-4 p-2 rounded"
                />
                <button className="bg-green-500 text-white px-6 py-2 rounded">
                  Try for FREE!
                </button>
              </form>
              <div className="mt-4">
                Trusted by IT Professionals 
              </div>
              <div className="mt-4 absolute top-0 right-0">
                <Link to="/signup">
                  <button className="bg-blue-500 text-white px-6 py-2 rounded mr-2">
                    Sign Up
                  </button>
                </Link>
                <Link to="/signin">
                  <button className="bg-blue-500 text-white px-6 py-2 rounded">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          } />
          
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* ... other routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
