import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './ratings.service.js';

export const getMovieRatings = asyncHandler(async (req, res) => {
  const { summary, items, meta } = await service.getMovieRatings(
    Number(req.params.movieId),
    req.query
  );
  return sendPaginated(res, {
    message: 'Lấy đánh giá phim thành công.',
    data: { summary, items },
    meta,
  });
});

export const upsertMyRating = asyncHandler(async (req, res) => {
  const data = await service.upsertMyRating(req.user.id, Number(req.params.movieId), req.body);
  return sendSuccess(res, {
    message: 'Gửi đánh giá phim thành công.',
    data,
  });
});
