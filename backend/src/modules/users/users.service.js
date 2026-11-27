import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { withTransaction } from '../../config/db.js';
import { AVATAR_UPLOAD_DIR } from '../../middlewares/upload.middleware.js';
import { AppError } from '../../utils/AppError.js';
import * as usersRepo from './users.repository.js';

const BCRYPT_ROUNDS = 10;

function formatProfile(user, activeSubscription) {
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
    account_tier: activeSubscription ? 'Thành viên Premium' : 'Thành viên Tiêu chuẩn',
    is_premium: Boolean(activeSubscription),
    active_subscription: activeSubscription,
    password_changed_at: user.password_changed_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function getMyProfile(userId) {
  const user = await usersRepo.findProfileById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy thông tin tài khoản.');
  }

  const activeSubscription = await usersRepo.findActiveSubscription(userId);
  return formatProfile(user, activeSubscription);
}

export async function updateMyProfile(userId, { full_name, email, phone_number }) {
  const duplicateEmail = await usersRepo.findOtherUserByEmail(email, userId);
  if (duplicateEmail) {
    throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Địa chỉ email này đã được tài khoản khác sử dụng.');
  }

  await usersRepo.updateProfile(userId, {
    fullName: full_name,
    email,
    phoneNumber: phone_number,
  });

  return getMyProfile(userId);
}

export async function updateMyAvatar(userId, uploadedFile) {
  const currentUser = await usersRepo.findProfileById(userId);
  if (!currentUser) {
    fs.unlink(uploadedFile.path, () => {});
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy thông tin tài khoản.');
  }

  const newAvatarUrl = `/uploads/avatars/${uploadedFile.filename}`;
  await usersRepo.updateAvatar(userId, newAvatarUrl);

  // Clean up previous local avatar file if any
  if (currentUser.avatar && currentUser.avatar.startsWith('/uploads/avatars/')) {
    const oldFilename = path.basename(currentUser.avatar);
    const oldFilePath = path.join(AVATAR_UPLOAD_DIR, oldFilename);
    if (oldFilePath !== uploadedFile.path) {
      fs.unlink(oldFilePath, () => {});
    }
  }

  return getMyProfile(userId);
}

export async function changeMyPassword(userId, { current_password, new_password }) {
  const record = await usersRepo.findPasswordHashById(userId);
  if (!record) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy thông tin tài khoản.');
  }

  const isCurrentValid = await bcrypt.compare(current_password, record.password);
  if (!isCurrentValid) {
    throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không chính xác.');
  }

  const isSameAsOld = await bcrypt.compare(new_password, record.password);
  if (isSameAsOld) {
    throw new AppError(400, 'SAME_PASSWORD', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  }

  const newPasswordHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

  await withTransaction(async (conn) => {
    await usersRepo.updatePasswordAndRevokeSessions(conn, userId, newPasswordHash, record.email);
  });

  return { changed: true };
}
