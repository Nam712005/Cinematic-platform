import bcrypt from 'bcryptjs';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './admin.users.repository.js';

const BCRYPT_ROUNDS = 10;

function formatAdminUser(u) {
  const isPremium = Boolean(u.is_premium);
  return {
    ...u,
    user_code: `USR${String(u.id).padStart(3, '0')}`,
    is_premium: isPremium,
    account_type_label:
      u.role_code === 'ADMIN' ? 'Quản trị viên' : isPremium ? 'Premium' : 'Thường',
    status_label: u.status === 1 ? 'Hoạt động' : 'Đã khóa',
  };
}

export async function listUsers(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 12, 100);
  const rawType = queryObj.account_type || queryObj.tier;
  const accountType = rawType ? String(rawType).trim().toUpperCase() : undefined;

  const { items, total } = await repo.listUsersAdmin({
    q: String(queryObj.q || '').trim(),
    accountType,
    status: queryObj.status,
    limit,
    offset,
  });

  return {
    items: items.map(formatAdminUser),
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getUserDetail(userId) {
  const user = await repo.findUserDetailAdmin(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
  }
  return formatAdminUser(user);
}

export async function createUser(payload) {
  const role = await repo.findRoleByCode(payload.role_code || 'MEMBER');
  if (!role) {
    throw new AppError(400, 'INVALID_ROLE', 'Vai trò không hợp lệ.');
  }

  const passwordHash = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
  const newId = await repo.createUserAdmin({
    roleId: role.id,
    username: payload.username,
    email: payload.email,
    passwordHash,
    fullName: payload.full_name,
    phoneNumber: payload.phone_number,
    status: payload.status ?? 1,
  });

  return getUserDetail(newId);
}

export async function updateUser(userId, payload, adminUser) {
  const existing = await repo.findUserDetailAdmin(userId);
  if (!existing) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
  }

  if (userId === adminUser.id && payload.status === 0) {
    throw new AppError(400, 'CANNOT_LOCK_SELF', 'Bạn không thể tự khóa tài khoản quản trị của chính mình.');
  }

  let roleId;
  if (payload.role_code) {
    const role = await repo.findRoleByCode(payload.role_code);
    if (!role) throw new AppError(400, 'INVALID_ROLE', 'Vai trò không hợp lệ.');
    roleId = role.id;
  }

  const passwordHash = payload.new_password
    ? await bcrypt.hash(payload.new_password, BCRYPT_ROUNDS)
    : null;

  await withTransaction((conn) =>
    repo.updateUserAdmin(conn, userId, {
      fullName: payload.full_name,
      email: payload.email,
      phoneNumber: payload.phone_number,
      roleId,
      status: payload.status,
      passwordHash,
    })
  );

  return getUserDetail(userId);
}

export async function toggleUserStatus(userId, status, adminUser) {
  if (userId === adminUser.id && status === 0) {
    throw new AppError(400, 'CANNOT_LOCK_SELF', 'Bạn không thể tự khóa tài khoản quản trị của chính mình.');
  }

  const existing = await repo.findUserDetailAdmin(userId);
  if (!existing) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
  }

  await withTransaction((conn) =>
    repo.setUserStatusAndRevokeTokens(conn, {
      userId,
      status,
      adminUser,
      targetEmail: existing.email,
    })
  );

  return getUserDetail(userId);
}
