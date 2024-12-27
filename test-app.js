const axios = require('axios');
const logger = require('./backend/services/logger');

const API_URL = 'http://localhost:3001/api';

async function testEndpoints() {
  try {
    // Test server health
    logger.info('Testing server health...');
    const healthCheck = await axios.get(`${API_URL}/`);
    logger.info('Server health check:', healthCheck.status === 200 ? 'OK' : 'Failed');

    // Test authentication endpoints
    logger.info('Testing authentication endpoints...');
    
    // Test signup
    const signupResponse = await axios.post(`${API_URL}/users/signup`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testPassword123!'
    });
    logger.info('Signup test:', signupResponse.status === 201 ? 'OK' : 'Failed');

    // Test signin
    const signinResponse = await axios.post(`${API_URL}/users/signin`, {
      email: 'test@example.com',
      password: 'testPassword123!'
    });
    logger.info('Signin test:', signinResponse.status === 200 ? 'OK' : 'Failed');

    const token = signinResponse.data.token;

    // Test protected endpoints with token
    const headers = { Authorization: `Bearer ${token}` };

    // Test profile
    const profileResponse = await axios.get(`${API_URL}/users/profile`, { headers });
    logger.info('Profile test:', profileResponse.status === 200 ? 'OK' : 'Failed');

    // Test subscription
    const subscriptionResponse = await axios.get(`${API_URL}/users/subscription`, { headers });
    logger.info('Subscription test:', subscriptionResponse.status === 200 ? 'OK' : 'Failed');

    logger.info('All tests completed successfully!');
  } catch (error) {
    logger.error('Test failed:', error.message);
    if (error.response) {
      logger.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Run tests
testEndpoints();
