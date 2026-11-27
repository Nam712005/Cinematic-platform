import axiosClient from './axiosClient.js';

export const adminApi = {
  // Dashboard, Reports & Notifications (UI15, UI24)
  getDashboard: () => axiosClient.get('/admin/dashboard').then((r) => r.data),
  getReports: (range = '30d') =>
    axiosClient.get('/admin/reports', { params: { range } }).then((r) => r.data),
  getActivityLogs: (params) =>
    axiosClient.get('/admin/activity-logs', { params }).then((r) => r.data),
  getNotifications: (params) =>
    axiosClient.get('/admin/notifications', { params }).then((r) => r.data),
  markAllNotificationsRead: () =>
    axiosClient.patch('/admin/notifications/read-all').then((r) => r.data),

  // Movies & NguonC Import (UI16)
  listMovies: (params) => axiosClient.get('/admin/movies', { params }).then((r) => r.data),
  getMovie: (id) => axiosClient.get(`/admin/movies/${id}`).then((r) => r.data),
  createMovie: (payload) => axiosClient.post('/admin/movies', payload).then((r) => r.data),
  updateMovie: (id, payload) => axiosClient.put(`/admin/movies/${id}`, payload).then((r) => r.data),
  deleteMovie: (id) => axiosClient.delete(`/admin/movies/${id}`).then((r) => r.data),
  searchNguonC: (params) => axiosClient.get('/admin/nguonc/search', { params }).then((r) => r.data),
  previewNguonC: (slugOrId, provider = 'NGUONC') =>
    axiosClient
      .get(`/admin/nguonc/preview/${encodeURIComponent(slugOrId)}`, { params: { provider } })
      .then((r) => r.data),
  previewMovieByUrl: (url, provider = 'NGUONC') =>
    axiosClient
      .get('/admin/nguonc/preview-url', { params: { url, provider } })
      .then((r) => r.data),
  importNguonC: (payload) =>
    axiosClient.post('/admin/movies/import-nguonc', payload).then((r) => r.data),

  // Episodes & Video Sources (UI17)
  listEpisodes: (movieId) =>
    axiosClient.get(`/admin/movies/${movieId}/episodes`).then((r) => r.data),
  createEpisode: (movieId, payload) =>
    axiosClient.post(`/admin/movies/${movieId}/episodes`, payload).then((r) => r.data),
  updateEpisode: (id, payload) =>
    axiosClient.put(`/admin/episodes/${id}`, payload).then((r) => r.data),
  deleteEpisode: (id) => axiosClient.delete(`/admin/episodes/${id}`).then((r) => r.data),
  listSources: (episodeId) =>
    axiosClient.get(`/admin/episodes/${episodeId}/sources`).then((r) => r.data),
  createSource: (episodeId, payload) =>
    axiosClient.post(`/admin/episodes/${episodeId}/sources`, payload).then((r) => r.data),
  updateSource: (id, payload) =>
    axiosClient.put(`/admin/sources/${id}`, payload).then((r) => r.data),
  deleteSource: (id) => axiosClient.delete(`/admin/sources/${id}`).then((r) => r.data),
  listMovieReports: (params) =>
    axiosClient.get('/admin/movie-reports', { params }).then((r) => r.data),
  resolveMovieReport: (id, payload) =>
    axiosClient.patch(`/admin/movie-reports/${id}/resolve`, payload).then((r) => r.data),

  // Taxonomy: categories, genres, countries, actors, directors (UI18)
  listTaxonomy: (type, params) =>
    axiosClient.get(`/admin/${type}`, { params }).then((r) => r.data),
  createTaxonomy: (type, payload) =>
    axiosClient.post(`/admin/${type}`, payload).then((r) => r.data),
  updateTaxonomy: (type, id, payload) =>
    axiosClient.put(`/admin/${type}/${id}`, payload).then((r) => r.data),
  deleteTaxonomy: (type, id) => axiosClient.delete(`/admin/${type}/${id}`).then((r) => r.data),

  // Users (UI19)
  listUsers: (params) => axiosClient.get('/admin/users', { params }).then((r) => r.data),
  getUserDetail: (id) => axiosClient.get(`/admin/users/${id}`).then((r) => r.data),
  createUser: (payload) => axiosClient.post('/admin/users', payload).then((r) => r.data),
  updateUser: (id, payload) => axiosClient.put(`/admin/users/${id}`, payload).then((r) => r.data),
  updateUserStatus: (id, status) =>
    axiosClient.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),

  // Premium Plans & Transactions (UI20, UI21)
  listPlans: () => axiosClient.get('/admin/premium-plans').then((r) => r.data),
  createPlan: (payload) => axiosClient.post('/admin/premium-plans', payload).then((r) => r.data),
  updatePlan: (id, payload) =>
    axiosClient.put(`/admin/premium-plans/${id}`, payload).then((r) => r.data),
  setPopularPlan: (id) =>
    axiosClient.patch(`/admin/premium-plans/${id}/popular`).then((r) => r.data),
  deletePlan: (id) => axiosClient.delete(`/admin/premium-plans/${id}`).then((r) => r.data),
  listTransactions: (params) =>
    axiosClient.get('/admin/transactions', { params }).then((r) => r.data),
  getTransactionDetail: (id) => axiosClient.get(`/admin/transactions/${id}`).then((r) => r.data),
  refundTransaction: (id, refund_reason) =>
    axiosClient.post(`/admin/transactions/${id}/refund`, { refund_reason }).then((r) => r.data),

  // Comments Moderation (UI22)
  listComments: (params) => axiosClient.get('/admin/comments', { params }).then((r) => r.data),
  updateCommentStatus: (id, payload) =>
    axiosClient.patch(`/admin/comments/${id}/status`, payload).then((r) => r.data),
  deleteComment: (id) => axiosClient.delete(`/comments/${id}`).then((r) => r.data),

  // Chatbot Config & Stats (UI23)
  getChatbotConfig: () => axiosClient.get('/admin/chatbot/config').then((r) => r.data),
  updateChatbotConfig: (payload) =>
    axiosClient.put('/admin/chatbot/config', payload).then((r) => r.data),
  testChatbotConnection: (payload = {}) =>
    axiosClient.post('/admin/chatbot/test-connection', payload).then((r) => r.data),
  getChatbotStats: () => axiosClient.get('/admin/chatbot/stats').then((r) => r.data),

  // System Settings (UI25)
  getSettings: () => axiosClient.get('/admin/settings').then((r) => r.data),
  updateSettings: (payload) => axiosClient.put('/admin/settings', payload).then((r) => r.data),
  resetSettings: () => axiosClient.post('/admin/settings/reset').then((r) => r.data),
  uploadSiteAsset: (assetType, file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('asset_type', assetType);
    return axiosClient
      .post('/admin/settings/upload-asset', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
