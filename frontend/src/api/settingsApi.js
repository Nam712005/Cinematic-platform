import axiosClient from './axiosClient.js';

export const settingsApi = {
  getPublicSettings: () => axiosClient.get('/settings/public').then((r) => r.data),
};
