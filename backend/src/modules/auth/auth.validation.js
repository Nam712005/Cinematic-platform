import { z } from 'zod';

const passwordRule = z
  .string({ required_error: 'Vui lòng nhập mật khẩu.' })
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.')
  .max(100, 'Mật khẩu tối đa 100 ký tự.');

export const registerSchema = z
  .object({
    full_name: z
      .string({ required_error: 'Vui lòng nhập họ và tên.' })
      .trim()
      .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
      .max(150, 'Họ và tên tối đa 150 ký tự.'),
    email: z
      .string({ required_error: 'Vui lòng nhập địa chỉ email.' })
      .trim()
      .toLowerCase()
      .email('Địa chỉ email không đúng định dạng.')
      .max(150, 'Email tối đa 150 ký tự.'),
    username: z
      .string({ required_error: 'Vui lòng nhập tên đăng nhập.' })
      .trim()
      .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự.')
      .max(50, 'Tên đăng nhập tối đa 50 ký tự.')
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        'Tên đăng nhập chỉ được chứa chữ cái, chữ số và các ký tự _, ., -.'
      ),
    password: passwordRule,
    confirm_password: z.string({ required_error: 'Vui lòng xác nhận mật khẩu.' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Xác nhận mật khẩu không khớp.',
  });

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Vui lòng nhập email hoặc tên đăng nhập.' })
    .trim()
    .min(1, 'Vui lòng nhập email hoặc tên đăng nhập.')
    .max(150, 'Thông tin đăng nhập quá dài.'),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu.' })
    .min(1, 'Vui lòng nhập mật khẩu.'),
  remember_me: z.boolean().optional().default(false),
});

export const refreshSchema = z.object({
  refresh_token: z
    .string({ required_error: 'Thiếu refresh_token.' })
    .trim()
    .min(1, 'Thiếu refresh_token.'),
});

export const logoutSchema = z.object({
  refresh_token: z
    .string({ required_error: 'Thiếu refresh_token.' })
    .trim()
    .min(1, 'Thiếu refresh_token.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập địa chỉ email.' })
    .trim()
    .toLowerCase()
    .email('Địa chỉ email không đúng định dạng.')
    .max(150, 'Email tối đa 150 ký tự.'),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'Thiếu mã xác thực đặt lại mật khẩu.' })
      .trim()
      .min(10, 'Mã xác thực không hợp lệ.'),
    new_password: passwordRule,
    confirm_password: z.string({ required_error: 'Vui lòng xác nhận mật khẩu mới.' }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Xác nhận mật khẩu mới không khớp.',
  });
