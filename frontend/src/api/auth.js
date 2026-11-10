import { api } from './client';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendCode: (data) => api.post('/auth/resend-code', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  getUsers: () => api.get('/auth/users'),
};
