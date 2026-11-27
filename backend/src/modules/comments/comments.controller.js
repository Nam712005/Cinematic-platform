import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './comments.service.js';

export const listMovieComments = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMovieComments(
    Number(req.params.movieId),
    req.query,
    req.user
  );
  return sendPaginated(res, { message: 'Lấy danh sách bình luận thành công.', data: items, meta });
});

export const createMovieComment = asyncHandler(async (req, res) => {
  const data = await service.createMovieComment(req.user.id, Number(req.params.movieId), req.body);
  return sendCreated(res, { message: 'Gửi bình luận thành công.', data });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const data = await service.toggleLike(Number(req.params.id), req.user.id);
  return sendSuccess(res, { message: 'Cập nhật lượt thích bình luận thành công.', data });
});

export const deleteComment = asyncHandler(async (req, res) => {
  await service.deleteComment(Number(req.params.id), req.user);
  return sendSuccess(res, { message: 'Xóa bình luận thành công.', data: null });
});

// Admin (UI22)
export const listCommentsAdmin = asyncHandler(async (req, res) => {
  const { items, summary, meta } = await service.listCommentsAdmin(req.query);
  return sendPaginated(res, {
    message: 'Lấy danh sách kiểm duyệt bình luận thành công.',
    data: { summary, items },
    meta,
  });
});

export const moderateComment = asyncHandler(async (req, res) => {
  const data = await service.moderateComment(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật trạng thái bình luận thành công.', data });
});
