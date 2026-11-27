import axiosClient from './axiosClient.js';

export const moviesApi = {
  getHomeData: () => axiosClient.get('/movies/home').then((r) => r.data),
  listMovies: (params) => axiosClient.get('/movies', { params }).then((r) => r.data),
  getMovieDetail: (slug) => axiosClient.get(`/movies/${slug}`).then((r) => r.data),
  watchEpisode: (slug, episodeSlug) =>
    axiosClient.get(`/movies/${slug}/watch/${episodeSlug}`).then((r) => r.data),
  likeMovie: (movieId) => axiosClient.post(`/movies/${movieId}/like`).then((r) => r.data),
  getTaxonomyAll: () => axiosClient.get('/taxonomy/filters').then((r) => r.data),
};
