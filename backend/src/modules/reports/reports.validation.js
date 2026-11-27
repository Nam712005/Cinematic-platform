import { z } from 'zod';

export const createReportSchema = z.object({
  reason: z
    .string({ required_error: 'Vui lòng chọn hoặc nhập lý do báo lỗi.' })
    .trim()
    .min(2, 'Lý do báo lỗi quá ngắn.')
    .max(100, 'Lý do báo lỗi tối đa 100 ký tự.'),
  description: z.string().trim().max(2000).nullable().optional(),
  episode_id: z.number().int().positive().nullable().optional(),
  video_source_id: z.number().int().positive().nullable().optional(),
});
