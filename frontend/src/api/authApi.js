import axiosClient from './axiosClient.js';

export const authApi = {
  register: (payload) => axiosClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data),
  refresh: (refreshToken) =>
    axiosClient.post('/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),
  logout: (refreshToken) =>
    axiosClient.post('/auth/logout', { refresh_token: refreshToken }).then((r) => r.data),
  forgotPassword: (email) =>
    axiosClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (payload) =>
    axiosClient.post('/auth/reset-password', payload).then((r) => r.data),
  getMyProfile: () => axiosClient.get('/users/me').then((r) => r.data),
  updateMyProfile: (payload) => axiosClient.put('/users/me', payload).then((r) => r.data),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return axiosClient
      .post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  changePassword: (payload) => axiosClient.put('/users/me/password', payload).then((r) => r.data),
};
