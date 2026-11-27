import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as usersService from './users.service.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await usersService.getMyProfile(req.user.id);
  return sendSuccess(res, {
    message: 'Lấy thông tin cá nhân thành công.',
    data: profile,
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await usersService.updateMyProfile(req.user.id, req.body);
  return sendSuccess(res, {
    message: 'Cập nhật thông tin cá nhân thành công.',
    data: profile,
  });
});

export const updateMyAvatar = asyncHandler(async (req, res) => {
  const profile = await usersService.updateMyAvatar(req.user.id, req.file);
  return sendSuccess(res, {
    message: 'Cập nhật ảnh đại diện thành công.',
    data: profile,
  });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  await usersService.changeMyPassword(req.user.id, req.body);
  return sendSuccess(res, {
    message: 'Đổi mật khẩu thành công. Các phiên đăng nhập cũ đã được thu hồi.',
    data: null,
  });
});
