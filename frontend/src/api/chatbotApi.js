import axiosClient from './axiosClient.js';

export const chatbotApi = {
  listSessions: () => axiosClient.get('/chatbot/sessions').then((r) => r.data),
  createSession: (payload = {}) =>
    axiosClient.post('/chatbot/sessions', payload).then((r) => r.data),
  getMessages: (sessionId) =>
    axiosClient.get(`/chatbot/sessions/${sessionId}/messages`).then((r) => r.data),
  sendMessage: (sessionId, message, currentMovieSlug = null) =>
    axiosClient
      .post(`/chatbot/sessions/${sessionId}/messages`, {
        message,
        currentMovieSlug: currentMovieSlug || null,
      })
      .then((r) => r.data),
  deleteSession: (sessionId) =>
    axiosClient.delete(`/chatbot/sessions/${sessionId}`).then((r) => r.data),
};
