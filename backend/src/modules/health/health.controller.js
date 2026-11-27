import { testConnection } from '../../config/db.js';
import { isSmtpConfigured } from '../../config/mail.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getHealth = asyncHandler(async (_req, res) => {
  const dbInfo = await testConnection();

  return sendSuccess(res, {
    message: 'Hệ thống CINEMATIC đang hoạt động bình thường.',
    data: {
      status: 'ok',
      service: 'cinematic-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: 'connected',
        name: dbInfo.dbName,
        version: dbInfo.version,
      },
      smtpConfigured: isSmtpConfigured(),
    },
  });
});
