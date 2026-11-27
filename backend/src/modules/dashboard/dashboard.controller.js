import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './dashboard.service.js';

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await service.getDashboardData();
  return sendSuccess(res, { message: 'Lấy dữ liệu Dashboard thành công.', data });
});

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await service.getActivityLogs(req.query);
  return sendPaginated(res, { message: 'Lấy nhật ký hoạt động thành công.', data: items, meta });
});

export const getReports = asyncHandler(async (req, res) => {
  const data = await service.getReportsData(String(req.query.range || '30d'));
  return sendSuccess(res, { message: 'Lấy báo cáo thống kê thành công.', data });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const { unread_count, items, meta } = await service.getMyNotifications(req.user.id, req.query);
  return sendPaginated(res, {
    message: 'Lấy danh sách thông báo thành công.',
    data: { unread_count, items },
    meta,
  });
});

export const markRead = asyncHandler(async (req, res) => {
  await service.markNotificationRead(req.user.id, Number(req.params.id));
  return sendSuccess(res, { message: 'Đã đánh dấu đã đọc thông báo.', data: null });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await service.markAllNotificationsRead(req.user.id);
  return sendSuccess(res, { message: 'Đã đánh dấu đã đọc tất cả thông báo.', data: null });
});
