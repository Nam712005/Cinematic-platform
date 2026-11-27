import bcrypt from 'bcryptjs';
import { withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import {
  generateRandomToken,
  getTokenExpirationDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../config/jwt.js';
import { isSmtpConfigured, sendMail } from '../../config/mail.js';
import { AppError } from '../../utils/AppError.js';
import * as authRepo from './auth.repository.js';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MINUTES = 15;

function formatUserSummary(user, activeSubscription = null) {
  return {
    id: user.id,
    uid_code: `UID-${String(user.id).padStart(5, '0')}`,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    phone_number: user.phone_number,
    avatar: user.avatar,
    role: user.role_code,
    role_name: user.role_name,
    password_changed_at: user.password_changed_at,
    created_at: user.created_at,
    is_premium: Boolean(activeSubscription),
    active_subscription: activeSubscription,
  };
}

export async function register({ full_name, email, username, password }) {
  const existing = await authRepo.findUserByEmailOrUsername(email, username);
  if (existing) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Địa chỉ email này đã được sử dụng.');
    }
    throw new AppError(409, 'USERNAME_ALREADY_EXISTS', 'Tên đăng nhập này đã tồn tại.');
  }

  const memberRole = await authRepo.findRoleByCode('MEMBER');
  if (!memberRole) {
    throw new AppError(500, 'ROLE_NOT_FOUND', 'Chưa khởi tạo vai trò MEMBER trong hệ thống.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const userId = await withTransaction(async (conn) => {
    const insertedId = await authRepo.createUser(conn, {
      roleId: memberRole.id,
      username,
      email,
      passwordHash,
      fullName: full_name,
    });

    await authRepo.insertActivityLog(conn, {
      userId: insertedId,
      actorLabel: email,
      actionType: 'USER_REGISTER',
      description: 'Người dùng mới đăng ký tài khoản',
      status: 'Thành công',
    });

    return insertedId;
  });

  const createdUser = await authRepo.findUserByIdWithRole(userId);
  return {
    user: formatUserSummary(createdUser, null),
  };
}

export async function login({ identifier, password, remember_me = false, userAgent, ipAddress }) {
  const user = await authRepo.findUserForLogin(identifier);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email/tên đăng nhập hoặc mật khẩu không chính xác.');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email/tên đăng nhập hoặc mật khẩu không chính xác.');
  }

  if (user.status !== 1) {
    throw new AppError(403, 'ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role_code });
  const refreshToken = signRefreshToken(
    { sub: user.id, role: user.role_code },
    { rememberMe: remember_me }
  );

  await authRepo.insertRefreshToken(null, {
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    rememberMe: remember_me,
    userAgent,
    ipAddress,
    expiresAt: getTokenExpirationDate(refreshToken),
  });

  const activeSubscription = await authRepo.findActiveSubscription(user.id);
  const redirectTo = user.role_code === 'ADMIN' ? '/admin/dashboard' : '/';

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    redirect_to: redirectTo,
    user: formatUserSummary(user, activeSubscription),
  };
}

export async function refresh({ refresh_token, userAgent, ipAddress }) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refresh_token);
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ hoặc đã hết hạn.');
  }

  const tokenHash = hashToken(refresh_token);
  const storedToken = await authRepo.findValidRefreshToken(tokenHash);
  if (!storedToken || storedToken.user_id !== decoded.sub) {
    throw new AppError(401, 'REFRESH_TOKEN_REVOKED', 'Phiên đăng nhập không hợp lệ hoặc đã bị thu hồi.');
  }

  const user = await authRepo.findUserByIdWithRole(storedToken.user_id);
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản không tồn tại.');
  }
  if (user.status !== 1) {
    throw new AppError(403, 'ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa.');
  }

  const rememberMe = Boolean(storedToken.remember_me);
  const newAccessToken = signAccessToken({ sub: user.id, role: user.role_code });
  const newRefreshToken = signRefreshToken(
    { sub: user.id, role: user.role_code },
    { rememberMe }
  );

  await withTransaction(async (conn) => {
    await authRepo.revokeRefreshTokenById(conn, storedToken.id);
    await authRepo.insertRefreshToken(conn, {
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      rememberMe,
      userAgent,
      ipAddress,
      expiresAt: getTokenExpirationDate(newRefreshToken),
    });
  });

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
  };
}

export async function logout({ refresh_token }) {
  await authRepo.revokeRefreshTokenByHash(hashToken(refresh_token));
  return { logged_out: true };
}

export async function forgotPassword({ email }) {
  if (!isSmtpConfigured()) {
    throw new AppError(
      503,
      'SMTP_NOT_CONFIGURED',
      'Hệ thống gửi email chưa được cấu hình SMTP. Vui lòng liên hệ quản trị viên.'
    );
  }

  const neutralResponse = {
    message:
      'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
  };

  const user = await authRepo.findActiveUserByEmail(email);
  if (!user) {
    return neutralResponse;
  }

  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await withTransaction(async (conn) => {
    await authRepo.invalidateOldPasswordResetTokens(conn, user.id);
    await authRepo.insertPasswordResetToken(conn, {
      userId: user.id,
      tokenHash,
      expiresAt,
    });
  });

  const resetUrl = `${env.clientUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendMail({
    to: user.email,
    subject: '[CINEMATIC] Yêu cầu đặt lại mật khẩu tài khoản',
    text: `Xin chào ${user.full_name || user.username},\n\nBạn vừa yêu cầu đặt lại mật khẩu tại CINEMATIC.\nVui lòng truy cập liên kết sau trong vòng ${RESET_TOKEN_TTL_MINUTES} phút:\n${resetUrl}\n\nNếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #111827;">CINEMATIC — Đặt lại mật khẩu</h2>
        <p>Xin chào <strong>${user.full_name || user.username}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới (liên kết có hiệu lực trong <strong>${RESET_TOKEN_TTL_MINUTES} phút</strong> và chỉ sử dụng 1 lần):</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">Nếu nút không hoạt động, hãy sao chép liên kết sau vào trình duyệt:<br/>${resetUrl}</p>
        <p style="font-size: 13px; color: #6b7280;">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này.</p>
      </div>
    `,
  });

  return neutralResponse;
}

export async function resetPassword({ token, new_password }) {
  const tokenHash = hashToken(token);
  const resetRecord = await authRepo.findValidPasswordResetToken(tokenHash);
  if (!resetRecord) {
    throw new AppError(
      400,
      'INVALID_OR_EXPIRED_TOKEN',
      'Liên kết đặt lại mật khẩu không hợp lệ, đã được sử dụng hoặc đã hết hạn.'
    );
  }

  const user = await authRepo.findUserByIdWithRole(resetRecord.user_id);
  if (!user || user.status !== 1) {
    throw new AppError(400, 'ACCOUNT_UNAVAILABLE', 'Tài khoản không tồn tại hoặc đã bị khóa.');
  }

  const passwordHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

  await withTransaction(async (conn) => {
    await authRepo.updateUserPassword(conn, user.id, passwordHash);
    await authRepo.markPasswordResetTokenUsed(conn, resetRecord.id);
    await authRepo.revokeAllUserRefreshTokens(conn, user.id);
    await authRepo.insertActivityLog(conn, {
      userId: user.id,
      actorLabel: user.email,
      actionType: 'PASSWORD_RESET',
      description: 'Người dùng đặt lại mật khẩu qua liên kết email',
      status: 'Thành công',
    });
  });

  return { reset: true };
}
