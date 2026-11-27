import { z } from 'zod';

export const adminCreateUserSchema = z.object({
  full_name: z.string({ required_error: 'Vui lòng nhập họ tên.' }).trim().min(2).max(150),
  email: z.string({ required_error: 'Vui lòng nhập email.' }).trim().toLowerCase().email().max(150),
  username: z
    .string({ required_error: 'Vui lòng nhập tên đăng nhập.' })
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Tên đăng nhập không hợp lệ.'),
  password: z.string({ required_error: 'Vui lòng nhập mật khẩu.' }).min(6).max(100),
  phone_number: z.string().trim().max(20).nullable().optional(),
  role_code: z.enum(['MEMBER', 'ADMIN']).optional().default('MEMBER'),
  status: z.number().int().min(0).max(1).optional().default(1),
});

export const adminUpdateUserSchema = z.object({
  full_name: z.string({ required_error: 'Vui lòng nhập họ tên.' }).trim().min(2).max(150),
  email: z.string({ required_error: 'Vui lòng nhập email.' }).trim().toLowerCase().email().max(150),
  phone_number: z.string().trim().max(20).nullable().optional(),
  role_code: z.enum(['MEMBER', 'ADMIN']).optional(),
  status: z.number().int().min(0).max(1).optional(),
  new_password: z.string().min(6).max(100).optional(),
});

export const adminToggleUserStatusSchema = z.object({
  status: z.number({ required_error: 'Thiếu trạng thái tài khoản.' }).int().min(0).max(1),
});
