import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './episodes.service.js';

export const listEpisodesByMovie = asyncHandler(async (req, res) => {
  const { movie, items, meta } = await service.listEpisodesByMovie(Number(req.params.movieId), req.query);
  return sendPaginated(res, {
    message: 'Lấy danh sách tập phim thành công.',
    data: { movie, episodes: items },
    meta,
  });
});

export const createEpisode = asyncHandler(async (req, res) => {
  const data = await service.createEpisode(Number(req.params.movieId), req.body);
  return sendCreated(res, { message: 'Thêm tập phim thành công.', data });
});

export const updateEpisode = asyncHandler(async (req, res) => {
  const data = await service.updateEpisode(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật tập phim thành công.', data });
});

export const deleteEpisode = asyncHandler(async (req, res) => {
  await service.deleteEpisode(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa tập phim thành công.', data: null });
});

// Video Sources
export const listSourcesByEpisode = asyncHandler(async (req, res) => {
  const data = await service.listSourcesByEpisode(Number(req.params.episodeId));
  return sendSuccess(res, { message: 'Lấy danh sách nguồn phát thành công.', data });
});

export const createSource = asyncHandler(async (req, res) => {
  const data = await service.createSource(Number(req.params.episodeId), req.body);
  return sendCreated(res, { message: 'Thêm nguồn phát thành công.', data });
});

export const updateSource = asyncHandler(async (req, res) => {
  const data = await service.updateSource(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật nguồn phát thành công.', data });
});

export const deleteSource = asyncHandler(async (req, res) => {
  await service.deleteSource(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa nguồn phát thành công.', data: null });
});
