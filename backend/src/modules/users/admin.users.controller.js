import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './admin.users.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listUsers(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách người dùng thành công.', data: items, meta });
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const data = await service.getUserDetail(Number(req.params.id));
  return sendSuccess(res, { message: 'Lấy thông tin người dùng thành công.', data });
});

export const createUser = asyncHandler(async (req, res) => {
  const data = await service.createUser(req.body);
  return sendCreated(res, { message: 'Thêm người dùng thành công.', data });
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = await service.updateUser(Number(req.params.id), req.body, req.user);
  return sendSuccess(res, { message: 'Cập nhật thông tin người dùng thành công.', data });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const data = await service.toggleUserStatus(Number(req.params.id), req.body.status, req.user);
  return sendSuccess(res, {
    message: req.body.status === 0 ? 'Đã khóa tài khoản và thu hồi phiên đăng nhập.' : 'Đã mở khóa tài khoản.',
    data,
  });
});
