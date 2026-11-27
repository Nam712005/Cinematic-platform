import { z } from 'zod';

const optionalSlug = z
  .string()
  .trim()
  .max(180)
  .regex(/^[a-z0-9-]*$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.')
  .optional();

export const categorySchema = z.object({
  name: z.string({ required_error: 'Vui lòng nhập tên danh mục.' }).trim().min(1).max(100),
  slug: optionalSlug,
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.number().int().min(0).max(1).optional().default(1),
});

export const genreSchema = z.object({
  name: z.string({ required_error: 'Vui lòng nhập tên thể loại.' }).trim().min(1).max(100),
  slug: optionalSlug,
  description: z.string().trim().max(255).nullable().optional(),
  status: z.number().int().min(0).max(1).optional().default(1),
});

export const countrySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(10)
    .nullable()
    .optional(),
  name: z.string({ required_error: 'Vui lòng nhập tên quốc gia.' }).trim().min(1).max(100),
  slug: optionalSlug,
});

export const personSchema = z.object({
  name: z.string({ required_error: 'Vui lòng nhập họ tên.' }).trim().min(1).max(150),
  slug: optionalSlug,
  avatar: z.string().trim().max(500).nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD.')
    .nullable()
    .optional(),
  nationality: z.string().trim().max(100).nullable().optional(),
});
