import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// Request interceptor to add CSRF token
api.interceptors.request.use(async (config) => {
  // Skip CSRF token for these routes
  const skipCSRF = ['/users/signin', '/users/signup', '/users/google-signin'];
  
  if (!skipCSRF.includes(config.url)) {
    try {
      const { data } = await axios.get('/api/csrf-token');
      config.headers['X-CSRF-Token'] = data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
