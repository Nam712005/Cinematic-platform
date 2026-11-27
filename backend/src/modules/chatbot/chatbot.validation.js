import { z } from 'zod';

export const createSessionSchema = z.object({
  session_title: z.string().trim().max(255).optional(),
});

export const sendMessageSchema = z.object({
  message: z
    .string({ required_error: 'Vui lòng nhập nội dung câu hỏi.' })
    .trim()
    .min(1, 'Nội dung câu hỏi không được để trống.')
    .max(4000, 'Câu hỏi tối đa 4000 ký tự.'),
  currentMovieSlug: z.string().trim().max(255).nullable().optional(),
  current_movie_slug: z.string().trim().max(255).nullable().optional(),
});

const providerEnumSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(z.enum(['OPENAI', 'GEMINI', 'GROQ']));

export const updateChatbotConfigSchema = z.object({
  is_enabled: z.boolean().optional(),
  active_provider: providerEnumSchema.optional(),
  provider: providerEnumSchema.optional(),
  ai_provider: providerEnumSchema.optional(),
  openai_model: z.string().trim().min(1).max(100).optional(),
  openai_api_key: z.string().trim().max(500).optional(),
  gemini_model: z.string().trim().min(1).max(100).optional(),
  gemini_api_key: z.string().trim().max(500).optional(),
  groq_model: z.string().trim().min(1).max(100).optional(),
  groq_api_key: z.string().trim().max(500).optional(),
  display_name: z.string().trim().min(1).max(100).optional(),
  bot_name: z.string().trim().min(1).max(100).optional(),
  greeting_message: z.string().trim().min(1).max(1000).optional(),
  welcome_message: z.string().trim().min(1).max(1000).optional(),
  system_prompt: z.string().trim().min(1).max(4000).optional(),
});

export const testChatbotConnectionSchema = z.object({
  provider: providerEnumSchema.optional(),
  model: z.string().trim().min(1).max(100).optional(),
  api_key: z.string().trim().max(500).optional(),
});
