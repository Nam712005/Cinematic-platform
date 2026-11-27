import { z } from 'zod';

export const updateSystemSettingsSchema = z.object({
  site: z
    .object({
      site_name: z.string().trim().min(1).max(100).optional(),
      site_email: z.string().trim().email().max(150).optional(),
      site_phone: z.string().trim().max(30).optional(),
      site_description: z.string().trim().max(1000).optional(),
      site_logo_url: z.string().trim().max(500).optional(),
      site_favicon_url: z.string().trim().max(500).optional(),
    })
    .optional(),
  payment: z
    .object({
      payment_zalopay_enabled: z.boolean().optional(),
      payment_momo_enabled: z.boolean().optional(),
      payment_bank_enabled: z.boolean().optional(),
      payment_bank_name: z.string().trim().max(200).optional(),
      payment_bank_account_no: z.string().trim().max(50).optional(),
      payment_bank_account_name: z.string().trim().max(150).optional(),
      payment_bank_syntax: z.string().trim().max(150).optional(),
    })
    .optional(),
  operations: z
    .object({
      movies_per_page: z.number().int().min(4).max(60).optional(),
      comments_per_page: z.number().int().min(5).max(50).optional(),
      admin_episodes_per_page: z.number().int().min(5).max(100).optional(),
      maintenance_mode: z.boolean().optional(),
      maintenance_message: z.string().trim().max(1000).optional(),
    })
    .optional(),
  footer: z
    .object({
      footer_copyright: z.string().trim().max(300).optional(),
      footer_support_email: z.string().trim().email().max(150).optional(),
      footer_address: z.string().trim().max(300).optional(),
      footer_terms_url: z.string().trim().max(255).optional(),
      footer_privacy_url: z.string().trim().max(255).optional(),
    })
    .optional(),
});
