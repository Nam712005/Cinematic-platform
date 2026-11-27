import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './reports.service.js';

export const submitReport = asyncHandler(async (req, res) => {
  const data = await service.submitReport(req.user?.id || null, Number(req.params.movieId), req.body);
  return sendCreated(res, { message: 'Đã gửi báo lỗi phim. Cảm ơn bạn đã phản hồi.', data });
});

export const listReportsAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listReportsAdmin(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách báo lỗi thành công.', data: items, meta });
});

export const resolveReport = asyncHandler(async (req, res) => {
  const data = await service.resolveReport(Number(req.params.id));
  return sendSuccess(res, { message: 'Đã đánh dấu xử lý báo lỗi.', data });
});
