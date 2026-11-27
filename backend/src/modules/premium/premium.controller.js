import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './premium.service.js';

// Public & Member
export const getPublicPlans = asyncHandler(async (_req, res) => {
  const data = await service.getPublicPlans();
  return sendSuccess(res, { message: 'Lấy danh sách gói Premium thành công.', data });
});

export const checkoutPreview = asyncHandler(async (req, res) => {
  const data = await service.createCheckoutPreview(req.user, req.body);
  return sendSuccess(res, { message: 'Tạo thông tin thanh toán mô phỏng thành công.', data });
});

export const completeMockPayment = asyncHandler(async (req, res) => {
  const data = await service.completeMockPayment(req.user, req.body);
  return sendCreated(res, {
    message: 'Thanh toán mô phỏng thành công. Gói Premium đã được kích hoạt.',
    data,
  });
});

export const getMyOrderHistory = asyncHandler(async (req, res) => {
  const { items, meta } = await service.getMyOrderHistory(req.user.id, req.query);
  return sendPaginated(res, { message: 'Lấy lịch sử đơn hàng thành công.', data: items, meta });
});

export const getOrderResult = asyncHandler(async (req, res) => {
  const data = await service.getOrderResult(req.params.orderCode, req.user);
  return sendSuccess(res, { message: 'Lấy kết quả thanh toán thành công.', data });
});

// Admin Plans (UI20)
export const listPlansAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listPlansAdmin(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách gói Premium thành công.', data: items, meta });
});

export const createPlanAdmin = asyncHandler(async (req, res) => {
  const data = await service.createPlanAdmin(req.body);
  return sendCreated(res, { message: 'Thêm gói Premium thành công.', data });
});

export const updatePlanAdmin = asyncHandler(async (req, res) => {
  const data = await service.updatePlanAdmin(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật gói Premium thành công.', data });
});

export const deletePlanAdmin = asyncHandler(async (req, res) => {
  await service.deletePlanAdmin(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa gói Premium thành công.', data: null });
});

export const setPopularPlanAdmin = asyncHandler(async (req, res) => {
  const data = await service.setPopularPlanAdmin(Number(req.params.id));
  return sendSuccess(res, { message: 'Đã cập nhật gói phổ biến nhất.', data });
});

// Admin Transactions & Simulated Refund (UI21)
export const listTransactionsAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listTransactionsAdmin(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách giao dịch thành công.', data: items, meta });
});

export const getTransactionDetailAdmin = asyncHandler(async (req, res) => {
  const data = await service.getTransactionDetailAdmin(Number(req.params.id));
  return sendSuccess(res, { message: 'Lấy chi tiết giao dịch thành công.', data });
});

export const refundTransactionAdmin = asyncHandler(async (req, res) => {
  const data = await service.refundTransactionAdmin(Number(req.params.id), req.body, req.user);
  return sendSuccess(res, {
    message: 'Hoàn tiền mô phỏng thành công và đã thu hồi quyền Premium của đơn hàng.',
    data,
  });
});
