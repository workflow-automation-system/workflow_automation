import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { clearStoredSession } from '../utils/session';

const API = axios.create({
  baseURL: API_BASE_URL,
});


// Intercepteur — ajoute le token JWT automatiquement à chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur — redirige vers /login si token expiré
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  register: async (payload) => {
    const res = await API.post('/auth/register', payload);
    return res.data;
  },

  login: async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    return res.data;
  },

  verifyEmail: async (token) => {
    const res = await API.post('/auth/verify-email', { token });
    return res.data;
  },

  resendVerification: async (email) => {
    const res = await API.post('/auth/resend-verification', { email });
    return res.data;
  },

  me: async () => {
    const res = await API.get('/auth/me');
    return res.data;
  },

  updateUserRole: async (userId, role) => {
    const res = await API.patch(`/auth/admin/users/${userId}/role`, { role });
    return res.data;
  },
};

export { API };
export default authService;
