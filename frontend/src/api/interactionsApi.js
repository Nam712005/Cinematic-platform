import { tokenStorage } from '../utils/storage.js';
import axiosClient from './axiosClient.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const interactionsApi = {
  // Watch History & Continue Watching
  listWatchHistory: (params) => axiosClient.get('/watch-histories', { params }).then((r) => r.data),
  getEpisodeProgress: (episodeId) =>
    axiosClient.get(`/watch-histories/episode/${episodeId}`).then((r) => r.data),
  saveWatchProgress: (payload) =>
    axiosClient.put('/watch-histories/progress', payload).then((r) => r.data),
  saveWatchProgressKeepalive: (payload) => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;
    try {
      fetch(`${API_BASE_URL}/watch-histories/progress`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // Ignore keepalive failure on unload
    }
  },
  deleteWatchHistory: (id) => axiosClient.delete(`/watch-histories/${id}`).then((r) => r.data),
  clearAllWatchHistory: () => axiosClient.delete('/watch-histories').then((r) => r.data),

  // Favorites
  listFavorites: (params) => axiosClient.get('/favorites', { params }).then((r) => r.data),
  addFavorite: (movieId) => axiosClient.post(`/favorites/${movieId}`).then((r) => r.data),
  removeFavorite: (movieId) => axiosClient.delete(`/favorites/${movieId}`).then((r) => r.data),
  clearAllFavorites: () => axiosClient.delete('/favorites').then((r) => r.data),

  // Ratings (1-5 stars)
  getMovieRatings: (movieId, params) =>
    axiosClient.get(`/movies/${movieId}/ratings`, { params }).then((r) => r.data),
  upsertRating: (movieId, payload) =>
    axiosClient.put(`/movies/${movieId}/ratings`, payload).then((r) => r.data),

  // Comments
  listComments: (movieId, params) =>
    axiosClient.get(`/movies/${movieId}/comments`, { params }).then((r) => r.data),
  createComment: (movieId, payload) =>
    axiosClient.post(`/movies/${movieId}/comments`, payload).then((r) => r.data),
  toggleCommentLike: (commentId) =>
    axiosClient.post(`/comments/${commentId}/like`).then((r) => r.data),
  deleteComment: (commentId) => axiosClient.delete(`/comments/${commentId}`).then((r) => r.data),

  // Movie Error Reports
  reportMovieError: (movieId, payload) =>
    axiosClient.post(`/movies/${movieId}/reports`, payload).then((r) => r.data),
};
