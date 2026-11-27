import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Vui lòng nhập nội dung bình luận.' })
    .trim()
    .min(1, 'Nội dung bình luận không được để trống.')
    .max(2000, 'Bình luận tối đa 2000 ký tự.'),
  episode_id: z.number().int().positive().nullable().optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  is_spoil: z.boolean().optional().default(false),
});

export const updateCommentStatusSchema = z.object({
  status: z.number({ required_error: 'Thiếu trạng thái bình luận.' }).int().min(0).max(1),
  hidden_reason: z.string().trim().max(255).nullable().optional(),
});
