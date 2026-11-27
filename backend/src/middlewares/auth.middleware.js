import { query } from '../config/db.js';
import { verifyAccessToken } from '../config/jwt.js';
import { AppError } from '../utils/AppError.js';

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token.trim();
}

async function loadActiveUserFromToken(token) {
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn. Vui lòng làm mới hoặc đăng nhập lại.');
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Token xác thực không hợp lệ.');
  }

  const rows = await query(
    `SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.status, r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [decoded.sub]
  );

  const user = rows[0];
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản không tồn tại hoặc đã bị xóa.');
  }

  if (user.status !== 1) {
    throw new AppError(403, 'ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
  }

  const subRows = await query(
    `SELECT s.id, s.plan_id, s.order_id, s.start_date, s.end_date, s.status, p.name AS plan_name, p.code AS plan_code
     FROM subscriptions s
     JOIN premium_plans p ON p.id = s.plan_id
     WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date > NOW()
     ORDER BY s.end_date DESC
     LIMIT 1`,
    [user.id]
  );

  const activeSubscription = subRows[0] || null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    avatar: user.avatar,
    role: user.role_code,
    roleName: user.role_name,
    isPremium: Boolean(activeSubscription),
    activeSubscription,
  };
}

export async function authenticate(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để tiếp tục.');
    }

    req.user = await loadActiveUserFromToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    req.user = await loadActiveUserFromToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
}
