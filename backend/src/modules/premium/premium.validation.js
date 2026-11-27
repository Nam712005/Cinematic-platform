import { z } from 'zod';

const paymentMethodEnum = z.enum(['ZALOPAY', 'MOMO', 'BANK_TRANSFER'], {
  errorMap: () => ({ message: 'Phương thức thanh toán phải là ZALOPAY, MOMO hoặc BANK_TRANSFER.' }),
});

export const checkoutPreviewSchema = z.object({
  plan_id: z.number({ required_error: 'Vui lòng chọn gói Premium.' }).int().positive(),
  payment_method: paymentMethodEnum,
});

export const completeMockPaymentSchema = z.object({
  plan_id: z.number({ required_error: 'Vui lòng chọn gói Premium.' }).int().positive(),
  payment_method: paymentMethodEnum,
  idempotency_key: z
    .string({ required_error: 'Thiếu mã chống trùng lặp giao dịch (idempotency_key).' })
    .trim()
    .min(8, 'idempotency_key không hợp lệ.')
    .max(100),
  qr_payload: z.string().trim().max(2000).nullable().optional(),
  note: z.string().trim().max(255).nullable().optional(),
});

export const premiumPlanSchema = z.object({
  code: z
    .string({ required_error: 'Vui lòng nhập mã gói Premium.' })
    .trim()
    .toUpperCase()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Mã gói chỉ chứa chữ in hoa, số, _ và -.'),
  name: z.string({ required_error: 'Vui lòng nhập tên gói Premium.' }).trim().min(2).max(100),
  duration_days: z.number({ required_error: 'Vui lòng nhập thời hạn ngày.' }).int().positive(),
  price: z.number({ required_error: 'Vui lòng nhập giá bán.' }).min(0),
  original_price: z.number().min(0).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  features: z.union([z.array(z.string().trim().min(1)), z.string()]).nullable().optional(),
  status: z.number().int().min(0).max(1).optional().default(1),
  is_popular: z.boolean().optional().default(false),
});

export const refundTransactionSchema = z.object({
  refund_reason: z
    .string()
    .trim()
    .max(500, 'Lý do hoàn tiền tối đa 500 ký tự.')
    .optional()
    .default('Admin thực hiện hoàn tiền mô phỏng theo yêu cầu'),
});
