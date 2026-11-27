import { z } from 'zod';

export const updateProfileSchema = z.object({
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
  phone_number: z
    .string()
    .trim()
    .max(20, 'Số điện thoại tối đa 20 ký tự.')
    .regex(/^[0-9+\-\s()]*$/, 'Số điện thoại không hợp lệ.')
    .nullable()
    .optional(),
});

export const changePasswordSchema = z
  .object({
    current_password: z
      .string({ required_error: 'Vui lòng nhập mật khẩu hiện tại.' })
      .min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
    new_password: z
      .string({ required_error: 'Vui lòng nhập mật khẩu mới.' })
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.')
      .max(100, 'Mật khẩu mới tối đa 100 ký tự.'),
    confirm_password: z.string({ required_error: 'Vui lòng xác nhận mật khẩu mới.' }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Xác nhận mật khẩu mới không khớp.',
  });
