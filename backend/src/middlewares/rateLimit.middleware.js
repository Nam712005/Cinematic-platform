import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.',
      errorCode: 'TOO_MANY_REQUESTS',
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều lần thử xác thực. Vui lòng thử lại sau ít phút.',
      errorCode: 'AUTH_RATE_LIMITED',
    });
  },
});
