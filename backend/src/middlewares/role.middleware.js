import { AppError } from '../utils/AppError.js';

export function requireRole(...allowedRoles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để tiếp tục.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập chức năng này.'));
    }

    return next();
  };
}
