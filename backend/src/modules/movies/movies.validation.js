import { z } from 'zod';

const urlOrEmpty = z.string().trim().max(500).nullable().optional();

const baseMovieFields = {
  api_id: z.string().trim().max(100).nullable().optional(),
  external_source: z.enum(['MANUAL', 'NGUONC', 'KKPHIM', 'OPHIM']).optional().default('MANUAL'),
  name: z.string({ required_error: 'Vui lòng nhập tên phim.' }).trim().min(1).max(255),
  origin_name: z.string().trim().max(255).nullable().optional(),
  slug: z
    .string()
    .trim()
    .max(255)
    .regex(/^[a-z0-9-]*$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.')
    .optional(),
  description: z.string().nullable().optional(),
  poster_url: urlOrEmpty,
  thumbnail_url: urlOrEmpty,
  banner_url: urlOrEmpty,
  release_year: z.number().int().min(1900).max(2100).nullable().optional(),
  type: z.enum(['SINGLE', 'SERIES']).optional().default('SINGLE'),
  access_type: z.enum(['FREE', 'PREMIUM']).optional().default('FREE'),
  movie_status: z.enum(['ONGOING', 'COMPLETED', 'UPCOMING']).optional().default('COMPLETED'),
  duration_minutes: z.number().int().min(1).max(2000).nullable().optional(),
  total_episodes: z.number().int().min(1).max(10000).optional().default(1),
  current_episode_info: z.string().trim().max(100).nullable().optional(),
  quality: z.string().trim().max(20).optional().default('HD'),
  language: z.string().trim().max(100).nullable().optional(),
  tmdb_id: z.number().int().positive().nullable().optional(),
  imdb_id: z.string().trim().max(30).nullable().optional(),
  status: z.number().int().min(0).max(1).optional().default(1),
  is_featured: z.boolean().optional().default(false),

  // Relation IDs (manual entry)
  genre_ids: z.array(z.number().int().positive()).optional(),
  country_ids: z.array(z.number().int().positive()).optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
  actor_ids: z.array(z.number().int().positive()).optional(),
  director_ids: z.array(z.number().int().positive()).optional(),

  // Optional names (used when Admin edits/imports names directly)
  genre_names: z.array(z.string().trim().min(1).max(100)).optional(),
  country_names: z.array(z.string().trim().min(1).max(100)).optional(),
  category_names: z.array(z.string().trim().min(1).max(100)).optional(),
  actor_names: z.array(z.string().trim().min(1).max(150)).optional(),
  director_names: z.array(z.string().trim().min(1).max(150)).optional(),
};

export const manualMovieSchema = z.object(baseMovieFields);

const importSourceSchema = z.object({
  source_name: z.string().trim().min(1).max(100),
  video_url: z.string().trim().min(1).max(1000),
  quality: z.string().trim().max(20).optional().default('HD'),
  format_type: z.enum(['HLS', 'MP4', 'EMBED']).optional().default('EMBED'),
  is_default: z.boolean().optional().default(false),
});

const importEpisodeSchema = z.object({
  episode_number: z.number().int().positive(),
  title: z.string().trim().max(255).nullable().optional(),
  slug: z.string().trim().min(1).max(255),
  duration_seconds: z.number().int().positive().nullable().optional(),
  sources: z.array(importSourceSchema).min(1),
});

export const importNguonCMovieSchema = z.object({
  ...baseMovieFields,
  external_source: z.enum(['MANUAL', 'NGUONC', 'KKPHIM', 'OPHIM']).optional().default('NGUONC'),
  episodes: z.array(importEpisodeSchema).optional().default([]),
});
