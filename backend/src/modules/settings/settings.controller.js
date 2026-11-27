import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getAdminSettings,
  getPublicSettings,
  resetAdminSettings,
  saveUploadedSiteAsset,
  updateAdminSettings,
} from './settings.service.js';

export const fetchPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await getPublicSettings();
  return sendSuccess(res, {
    message: 'Lấy cấu hình công khai thành công.',
    data: settings,
  });
});

export const fetchAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await getAdminSettings();
  return sendSuccess(res, {
    message: 'Lấy cấu hình hệ thống thành công.',
    data: settings,
  });
});

export const saveAdminSettings = asyncHandler(async (req, res) => {
  const settings = await updateAdminSettings(req.body, req.user);
  return sendSuccess(res, {
    message: 'Lưu cấu hình hệ thống thành công.',
    data: settings,
  });
});

export const restoreDefaultSettings = asyncHandler(async (req, res) => {
  const settings = await resetAdminSettings(req.user);
  return sendSuccess(res, {
    message: 'Khôi phục cấu hình mặc định thành công.',
    data: settings,
  });
});

export const uploadSiteAsset = asyncHandler(async (req, res) => {
  const assetType = req.body?.asset_type === 'favicon' ? 'favicon' : 'logo';
  const data = await saveUploadedSiteAsset(assetType, req.file, req.user);
  return sendSuccess(res, {
    message: 'Tải lên tài nguyên website thành công.',
    data,
  });
});
