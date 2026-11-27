import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendCreated(res, {
    message: 'Đăng ký tài khoản thành công.',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    ...req.body,
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || '',
  });
  return sendSuccess(res, {
    message: 'Đăng nhập thành công.',
    data: result,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh({
    ...req.body,
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || '',
  });
  return sendSuccess(res, {
    message: 'Làm mới phiên đăng nhập thành công.',
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body);
  return sendSuccess(res, {
    message: 'Đăng xuất thành công.',
    data: null,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return sendSuccess(res, {
    message: result.message,
    data: null,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, {
    message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
    data: null,
  });
});
