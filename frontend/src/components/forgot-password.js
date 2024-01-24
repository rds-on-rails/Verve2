import React, { useState } from 'react';
import axios from 'axios';
// Import any necessary libraries or modules

// Create a ForgotPassword component
function ForgotPassword() {
    const [email, setEmail] = useState('');

    // Function to handle the forgot password action
    function handleForgotPassword() {
        // Add your code here to handle the forgot password action
        // For example, you can send a request to the server to reset the password
       
        //use axios to send the request
        axios.post('http://localhost:3000/api/users/forgot-password', {
            email
        });
        //use the forgot password route in the backend

        console.log('Forgot password action triggered');
        console.log('Email:', email);
    }

    return (
        <div>
            <h2>Forgot Password</h2>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleForgotPassword}>Reset Password</button>
        </div>
    );
}

// Export the ForgotPassword component
export default ForgotPassword;
