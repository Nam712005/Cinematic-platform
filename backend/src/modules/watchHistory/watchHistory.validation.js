import { z } from 'zod';

export const upsertProgressSchema = z.object({
  movie_id: z.number({ required_error: 'Thiếu movie_id.' }).int().positive(),
  episode_id: z.number({ required_error: 'Thiếu episode_id.' }).int().positive(),
  stopped_at_seconds: z
    .number({ required_error: 'Thiếu vị trí xem hiện tại (giây).' })
    .min(0, 'Vị trí xem không được âm.'),
  duration_seconds: z
    .number({ required_error: 'Thiếu tổng thời lượng video (giây).' })
    .positive('Tổng thời lượng video phải lớn hơn 0.'),
  is_ended: z.boolean().optional().default(false),
  restart_from_zero: z.boolean().optional().default(false),
});
