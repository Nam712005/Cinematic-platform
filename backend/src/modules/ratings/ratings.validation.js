import { z } from 'zod';

export const upsertRatingSchema = z.object({
  score: z
    .number({ required_error: 'Vui lòng chọn số sao đánh giá (1–5).' })
    .int('Điểm đánh giá phải là số nguyên từ 1 đến 5.')
    .min(1, 'Điểm đánh giá tối thiểu là 1 sao.')
    .max(5, 'Điểm đánh giá tối đa là 5 sao.'),
  review: z.string().trim().max(2000, 'Nội dung nhận xét tối đa 2000 ký tự.').nullable().optional(),
});
