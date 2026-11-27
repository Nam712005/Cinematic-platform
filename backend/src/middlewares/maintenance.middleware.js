import { getMaintenanceState } from '../modules/settings/settings.service.js';

const BYPASS_EXACT_PATHS = new Set([
  '/api/health',
  '/api/settings/public',
  '/api/auth/login',
  '/api/auth/refresh',
]);

function shouldBypassMaintenance(pathname) {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  if (BYPASS_EXACT_PATHS.has(normalized)) {
    return true;
  }

  if (normalized === '/api/admin' || normalized.startsWith('/api/admin/')) {
    return true;
  }

  return false;
}

export async function maintenanceMiddleware(req, res, next) {
  try {
    if (shouldBypassMaintenance(req.path)) {
      return next();
    }

    const { enabled, message } = await getMaintenanceState();
    if (enabled) {
      return res.status(503).json({
        success: false,
        message:
          message ||
          'Hệ thống CINEMATIC đang bảo trì định kỳ để nâng cấp chất lượng dịch vụ. Vui lòng quay lại sau ít phút!',
        errorCode: 'MAINTENANCE_MODE',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
