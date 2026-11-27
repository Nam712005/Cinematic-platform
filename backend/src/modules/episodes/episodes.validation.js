import { z } from 'zod';

export const episodeSchema = z.object({
  episode_number: z.number({ required_error: 'Vui lòng nhập số thứ tự tập.' }).int().positive(),
  title: z.string().trim().max(255).nullable().optional(),
  slug: z
    .string()
    .trim()
    .max(255)
    .regex(/^[a-z0-9-]*$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.')
    .optional(),
  duration_seconds: z.number().int().positive().nullable().optional(),
  status: z.number().int().min(0).max(1).optional().default(1),
  release_date: z.string().nullable().optional(),
});

export const videoSourceSchema = z.object({
  source_name: z.string({ required_error: 'Vui lòng nhập tên server phát.' }).trim().min(1).max(100),
  video_url: z
    .string({ required_error: 'Vui lòng nhập đường dẫn nguồn phát.' })
    .trim()
    .min(1)
    .max(1000)
    .url('Đường dẫn nguồn phát phải là URL hợp lệ.'),
  quality: z.string().trim().max(20).optional().default('1080p'),
  format_type: z.enum(['HLS', 'MP4', 'EMBED']).optional().default('EMBED'),
  is_default: z.boolean().optional().default(false),
  status: z.number().int().min(0).max(1).optional().default(1),
});
