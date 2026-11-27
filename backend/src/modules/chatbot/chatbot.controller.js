import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './chatbot.service.js';

// Member (UI11)
export const listMySessions = asyncHandler(async (req, res) => {
  const data = await service.listMySessions(req.user.id);
  return sendSuccess(res, { message: 'Lấy danh sách phiên hội thoại thành công.', data });
});

export const createMySession = asyncHandler(async (req, res) => {
  const data = await service.createMySession(req.user.id, req.body);
  return sendCreated(res, { message: 'Tạo phiên hội thoại mới thành công.', data });
});

export const getSessionMessages = asyncHandler(async (req, res) => {
  const data = await service.getSessionMessages(Number(req.params.id), req.user.id);
  return sendSuccess(res, { message: 'Lấy lịch sử tin nhắn thành công.', data });
});

export const deleteMySession = asyncHandler(async (req, res) => {
  await service.deleteMySession(Number(req.params.id), req.user.id);
  return sendSuccess(res, { message: 'Đã xóa phiên hội thoại.', data: null });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const data = await service.sendMessageInSession(Number(req.params.id), req.user.id, req.body);
  return sendCreated(res, { message: 'Gửi câu hỏi thành công.', data });
});

// Admin (UI23)
export const getAdminConfig = asyncHandler(async (_req, res) => {
  const data = await service.getAdminChatbotConfig();
  return sendSuccess(res, { message: 'Lấy cấu hình Chatbot AI thành công.', data });
});

export const updateAdminConfig = asyncHandler(async (req, res) => {
  const data = await service.updateAdminChatbotConfig(req.body, req.user);
  return sendSuccess(res, { message: 'Lưu cấu hình Chatbot AI thành công.', data });
});

export const testAdminConnection = asyncHandler(async (req, res) => {
  const data = await service.testAdminChatbotConnection(req.body);
  return sendSuccess(res, { message: 'Kiểm tra kết nối AI thành công.', data });
});

export const getAdminStats = asyncHandler(async (_req, res) => {
  const data = await service.getAdminChatbotStats();
  return sendSuccess(res, { message: 'Lấy thống kê Chatbot AI thành công.', data });
});
