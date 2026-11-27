import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as moviesService from './movies.service.js';

// ---------- PUBLIC ----------
export const getHome = asyncHandler(async (_req, res) => {
  const data = await moviesService.getHomePageData();
  return sendSuccess(res, { message: 'Lấy dữ liệu trang chủ thành công.', data });
});

export const searchMovies = asyncHandler(async (req, res) => {
  const { items, meta } = await moviesService.searchPublicMovies(req.query);
  return sendPaginated(res, { message: 'Tìm kiếm phim thành công.', data: items, meta });
});

export const getMovieDetail = asyncHandler(async (req, res) => {
  const data = await moviesService.getMovieDetailBySlug(req.params.slug, req.user);
  return sendSuccess(res, { message: 'Lấy chi tiết phim thành công.', data });
});

export const watchEpisode = asyncHandler(async (req, res) => {
  const data = await moviesService.getEpisodeWatchData(
    req.params.slug,
    req.params.episodeSlug,
    req.user
  );
  return sendSuccess(res, { message: 'Lấy dữ liệu phát tập phim thành công.', data });
});

export const likeMovie = asyncHandler(async (req, res) => {
  const data = await moviesService.likeMovie(Number(req.params.id));
  return sendSuccess(res, { message: 'Đã ghi nhận lượt thích phim.', data });
});

// ---------- ADMIN ----------
export const listMoviesAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await moviesService.listMoviesAdmin(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách phim quản trị thành công.', data: items, meta });
});

export const getMovieAdmin = asyncHandler(async (req, res) => {
  const data = await moviesService.getMovieAdminById(Number(req.params.id));
  return sendSuccess(res, { message: 'Lấy chi tiết phim thành công.', data });
});

export const createManualMovie = asyncHandler(async (req, res) => {
  const data = await moviesService.createManualMovie(req.body, req.user);
  return sendCreated(res, { message: 'Thêm phim thủ công thành công.', data });
});

export const updateMovieAdmin = asyncHandler(async (req, res) => {
  const data = await moviesService.updateMovieAdmin(Number(req.params.id), req.body, req.user);
  return sendSuccess(res, { message: 'Cập nhật phim thành công.', data });
});

export const deleteMovieAdmin = asyncHandler(async (req, res) => {
  await moviesService.deleteMovieAdmin(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa phim thành công.', data: null });
});

// ---------- MULTI-PROVIDER IMPORT ----------
export const searchNguonC = asyncHandler(async (req, res) => {
  const data = await moviesService.searchNguonCMovies(
    req.query.keyword,
    req.query.page,
    req.query.provider
  );
  return sendSuccess(res, { message: 'Tra cứu danh sách nguồn phim thành công.', data });
});

export const previewNguonC = asyncHandler(async (req, res) => {
  const data = await moviesService.previewNguonCMovie(req.params.slugOrId, req.query.provider);
  return sendSuccess(res, { message: 'Lấy dữ liệu xem trước thành công.', data });
});

export const previewMovieByUrl = asyncHandler(async (req, res) => {
  const data = await moviesService.previewMovieByUrl(req.query.url, req.query.provider);
  return sendSuccess(res, { message: 'Phân tích đường dẫn phim thành công.', data });
});

export const importNguonC = asyncHandler(async (req, res) => {
  const data = await moviesService.importNguonCMovie(req.body, req.user);
  return sendCreated(res, { message: 'Nhập phim vào CINEMATIC thành công.', data });
});
