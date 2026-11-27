import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './favorites.service.js';

export const listMyFavorites = asyncHandler(async (req, res) => {
  const { items, counts, meta } = await service.listMyFavorites(req.user.id, req.query);
  return sendPaginated(res, {
    message: 'Lấy danh sách yêu thích thành công.',
    data: { counts, items },
    meta,
  });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const data = await service.addFavorite(req.user.id, Number(req.params.movieId));
  return sendSuccess(res, {
    message: 'Đã thêm phim vào danh sách yêu thích.',
    data,
  });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await service.removeFavorite(req.user.id, Number(req.params.movieId));
  return sendSuccess(res, {
    message: 'Đã xóa phim khỏi danh sách yêu thích.',
    data: null,
  });
});

export const clearAllFavorites = asyncHandler(async (req, res) => {
  const data = await service.clearAllFavorites(req.user.id);
  return sendSuccess(res, {
    message: 'Đã xóa toàn bộ danh sách yêu thích.',
    data,
  });
});
