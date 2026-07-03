import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests if stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('propx_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle response errors globally (e.g. redirect on 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local auth on unauthorized access
      localStorage.removeItem('propx_auth_token');
      // Option: window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
