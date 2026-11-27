import crypto from 'node:crypto';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './premium.repository.js';

function parseFeatures(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback newline separated
  }
  return String(raw)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatPlan(plan) {
  return {
    ...plan,
    is_popular: Boolean(plan.is_popular),
    plan_code_display: `PRE${String(plan.id).padStart(3, '0')}`,
    features: parseFeatures(plan.features),
  };
}

function generateCode(prefix) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${y}${m}${d}${rand}`;
}

// ---------- PUBLIC PLANS (UI12) ----------
export async function getPublicPlans() {
  const rows = await repo.listPublicPlans();
  return rows.map(formatPlan);
}

const PAYMENT_METHOD_SETTING_MAP = {
  ZALOPAY: { key: 'payment_zalopay_enabled', label: 'ZaloPay QR' },
  MOMO: { key: 'payment_momo_enabled', label: 'Ví MoMo QR' },
  BANK_TRANSFER: { key: 'payment_bank_enabled', label: 'Chuyển khoản ngân hàng' },
};

function isSettingEnabled(rawValue, fallback = true) {
  if (rawValue === undefined || rawValue === null) return fallback;
  const normalized = String(rawValue).trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

async function assertPaymentMethodEnabled(paymentMethod) {
  const bankSettings = await repo.getPaymentBankDisplaySettings();
  const meta = PAYMENT_METHOD_SETTING_MAP[paymentMethod];
  if (!meta) {
    throw new AppError(400, 'INVALID_PAYMENT_METHOD', 'Phương thức thanh toán không hợp lệ.');
  }
  if (!isSettingEnabled(bankSettings[meta.key], true)) {
    throw new AppError(
      400,
      'PAYMENT_METHOD_DISABLED',
      `Phương thức thanh toán ${meta.label} hiện đang tạm đóng. Vui lòng chọn phương thức khác hoặc quay lại sau.`
    );
  }
  return bankSettings;
}

// ---------- CHECKOUT PREVIEW WITH MOCK QR CODE (UI13 - NO DB WRITE) ----------
export async function createCheckoutPreview(user, { plan_id, payment_method }) {
  const bankSettings = await assertPaymentMethodEnabled(payment_method);

  const plan = await repo.findActivePlanById(plan_id);
  if (!plan) {
    throw new AppError(404, 'PLAN_NOT_FOUND', 'Gói Premium không tồn tại hoặc đã ngừng kinh doanh.');
  }
  const idempotencyKey = crypto.randomUUID();
  const previewRef = generateCode('QR');
  const price = Number(plan.price);

  const maxActiveEnd = await repo.getMaxActiveSubscriptionEnd(user.id);
  const startDate = maxActiveEnd ? new Date(maxActiveEnd) : new Date();
  const endDate = new Date(startDate.getTime() + Number(plan.duration_days) * 24 * 60 * 60 * 1000);

  const qrPayload = `CINEMATIC|MOCK_PAYMENT|${payment_method}|${plan.code}|${price}|${previewRef}`;

  return {
    is_mock_payment: true,
    notice: 'Đây là giao dịch mô phỏng có hiển thị QR Code. Không yêu cầu chuyển tiền thật.',
    idempotency_key: idempotencyKey,
    payment_method,
    qr_payload: qrPayload,
    reference_code: previewRef,
    payer: {
      full_name: user.fullName,
      email: user.email,
    },
    plan: formatPlan(plan),
    summary: {
      plan_name: plan.name,
      duration_days: plan.duration_days,
      price,
      discount_amount: 0,
      final_amount: price,
      estimated_start_date: startDate.toISOString(),
      estimated_end_date: endDate.toISOString(),
      is_chained_extension: Boolean(maxActiveEnd),
    },
    bank_info:
      payment_method === 'BANK_TRANSFER'
        ? {
            bank_name: bankSettings.payment_bank_name || 'Ngân hàng TMCP Quân đội (MBBank)',
            account_no: bankSettings.payment_bank_account_no || '090123456789',
            account_name: bankSettings.payment_bank_account_name || 'CINEMATIC MEDIA',
            transfer_content: `CINEMATIC ${previewRef}`,
          }
        : null,
  };
}

// ---------- COMPLETE MOCK PAYMENT IN 1 DB TRANSACTION (UI13 -> UI28) ----------
export async function completeMockPayment(user, payload) {
  await assertPaymentMethodEnabled(payload.payment_method);

  const orderCode = generateCode('DH');
  const transactionNo = generateCode('TRX');

  await withTransaction(async (conn) => {
    // Anti-duplicate idempotency check
    const existingOrder = await repo.findOrderByIdempotencyKey(conn, payload.idempotency_key);
    if (existingOrder) {
      throw new AppError(
        409,
        'DUPLICATE_PAYMENT',
        'Giao dịch này đã được xử lý trước đó. Vui lòng kiểm tra lịch sử đơn hàng.'
      );
    }

    const plan = await repo.findActivePlanForUpdate(conn, payload.plan_id);
    if (!plan) {
      throw new AppError(404, 'PLAN_NOT_FOUND', 'Gói Premium không tồn tại hoặc đã ngừng kinh doanh.');
    }

    const qrPayload =
      payload.qr_payload ||
      `CINEMATIC|MOCK_PAYMENT|${payload.payment_method}|${plan.code}|${plan.price}|${orderCode}`;

    await repo.createPaidOrderTransaction(conn, {
      orderCode,
      transactionNo,
      idempotencyKey: payload.idempotency_key,
      userId: user.id,
      userEmail: user.email,
      plan,
      paymentMethod: payload.payment_method,
      qrPayload,
      note: payload.note,
    });
  });

  return repo.findOrderDetailByCode(orderCode);
}

// ---------- MEMBER ORDER HISTORY (UI14) & RESULT (UI28) ----------
export async function getMyOrderHistory(userId, queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 10, 50);
  const filter = queryObj.filter ? String(queryObj.filter).trim().toLowerCase() : 'all';

  const { items, total } = await repo.listMemberOrders(userId, { filter, limit, offset });

  const formatted = items.map((row) => ({
    ...row,
    payment_status_label: row.order_status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã thanh toán',
    subscription_status_label:
      row.subscription_status === 'REVOKED'
        ? 'Đã thu hồi'
        : row.subscription_status === 'ACTIVE'
          ? 'Còn hạn'
          : 'Hết hạn',
  }));

  return {
    items: formatted,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getOrderResult(orderCode, currentUser) {
  const detail = await repo.findOrderDetailByCode(orderCode);
  if (!detail) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
  }
  if (currentUser.role !== 'ADMIN' && detail.user_id !== currentUser.id) {
    throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền xem đơn hàng này.');
  }
  return {
    ...detail,
    payment_status_label: detail.order_status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã thanh toán',
    subscription_status_label:
      detail.subscription_status === 'REVOKED'
        ? 'Đã thu hồi'
        : detail.subscription_status === 'ACTIVE'
          ? 'Còn hạn'
          : 'Hết hạn',
  };
}

// ---------- ADMIN PLANS CRUD (UI20) ----------
export async function listPlansAdmin(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 20, 100);
  const { items, total } = await repo.listPlansAdmin({
    q: String(queryObj.q || '').trim(),
    status: queryObj.status,
    limit,
    offset,
  });
  return { items: items.map(formatPlan), meta: buildPaginationMeta(page, limit, total) };
}

function serializeFeatures(features) {
  if (!features) return null;
  if (Array.isArray(features)) return JSON.stringify(features);
  return String(features);
}

export async function createPlanAdmin(payload) {
  const newId = await withTransaction((conn) =>
    repo.createPlan(conn, {
      ...payload,
      featuresJson: serializeFeatures(payload.features),
    })
  );
  const created = await repo.findPlanById(newId);
  return formatPlan(created);
}

export async function updatePlanAdmin(planId, payload) {
  const existing = await repo.findPlanById(planId);
  if (!existing) {
    throw new AppError(404, 'PLAN_NOT_FOUND', 'Không tìm thấy gói Premium.');
  }
  await withTransaction((conn) =>
    repo.updatePlan(conn, planId, {
      ...payload,
      is_popular:
        payload.is_popular !== undefined ? Boolean(payload.is_popular) : Boolean(existing.is_popular),
      featuresJson: serializeFeatures(payload.features),
    })
  );
  const updated = await repo.findPlanById(planId);
  return formatPlan(updated);
}

export async function setPopularPlanAdmin(planId) {
  const existing = await repo.findPlanById(planId);
  if (!existing) {
    throw new AppError(404, 'PLAN_NOT_FOUND', 'Không tìm thấy gói Premium.');
  }
  await withTransaction((conn) => repo.setPopularPlan(conn, planId));
  const updated = await repo.findPlanById(planId);
  return formatPlan(updated);
}

export async function deletePlanAdmin(planId) {
  const existing = await repo.findPlanById(planId);
  if (!existing) {
    throw new AppError(404, 'PLAN_NOT_FOUND', 'Không tìm thấy gói Premium.');
  }
  await repo.deletePlan(planId);
}

// ---------- ADMIN TRANSACTIONS & SIMULATED REFUND (UI21) ----------
export async function listTransactionsAdmin(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 10, 100);
  const { items, total } = await repo.listTransactionsAdmin({
    q: String(queryObj.q || '').trim(),
    provider: queryObj.provider ? String(queryObj.provider).toUpperCase() : undefined,
    status: queryObj.status ? String(queryObj.status).toUpperCase() : undefined,
    limit,
    offset,
  });

  const formatted = items.map((row) => ({
    ...row,
    payment_status_label: row.payment_status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã thanh toán',
  }));

  return { items: formatted, meta: buildPaginationMeta(page, limit, total) };
}

export async function getTransactionDetailAdmin(paymentId) {
  const detail = await repo.findTransactionDetailById(paymentId);
  if (!detail) {
    throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Không tìm thấy giao dịch.');
  }
  return {
    ...detail,
    payment_status_label: detail.payment_status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã thanh toán',
  };
}

export async function refundTransactionAdmin(paymentId, { refund_reason }, adminUser) {
  await withTransaction(async (conn) => {
    const paymentRow = await repo.lockPaymentForRefund(conn, paymentId);
    if (!paymentRow) {
      throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Không tìm thấy giao dịch.');
    }

    if (paymentRow.payment_status !== 'PAID') {
      throw new AppError(
        400,
        'ALREADY_REFUNDED',
        'Giao dịch này đã được hoàn tiền trước đó và không thể hoàn tiền lần nữa.'
      );
    }

    await repo.executeSimulatedRefund(conn, {
      paymentRow,
      adminUser,
      refundReason: refund_reason,
    });
  });

  return getTransactionDetailAdmin(paymentId);
}
