import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './watchHistory.service.js';

export const listMyHistory = asyncHandler(async (req, res) => {
  const { items, meta } = await service.getMyWatchHistory(req.user.id, req.query);
  return sendPaginated(res, {
    message: 'Lấy lịch sử xem phim thành công.',
    data: items,
    meta,
  });
});

export const getEpisodeProgress = asyncHandler(async (req, res) => {
  const data = await service.getEpisodeProgress(req.user.id, Number(req.params.episodeId));
  return sendSuccess(res, {
    message: 'Lấy tiến độ xem tập phim thành công.',
    data,
  });
});

export const upsertProgress = asyncHandler(async (req, res) => {
  const data = await service.saveWatchProgress(req.user.id, req.body);
  return sendSuccess(res, {
    message: 'Cập nhật tiến độ xem phim thành công.',
    data,
  });
});

export const deleteHistoryItem = asyncHandler(async (req, res) => {
  await service.removeWatchHistoryItem(req.user.id, Number(req.params.id));
  return sendSuccess(res, {
    message: 'Đã xóa mục lịch sử xem phim.',
    data: null,
  });
});

export const clearAllHistory = asyncHandler(async (req, res) => {
  const data = await service.clearMyWatchHistory(req.user.id);
  return sendSuccess(res, {
    message: 'Đã xóa toàn bộ lịch sử xem phim.',
    data,
  });
});
