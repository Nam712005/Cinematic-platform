import { query } from '../../config/db.js';

export async function findProfileById(userId) {
  const rows = await query(
    `SELECT u.id, u.username, u.email, u.full_name, u.phone_number, u.avatar,
            u.status, u.is_email_verified, u.password_changed_at, u.created_at, u.updated_at,
            r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function findPasswordHashById(userId) {
  const rows = await query('SELECT id, email, password FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

export async function findOtherUserByEmail(email, excludeUserId) {
  const rows = await query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [
    email,
    excludeUserId,
  ]);
  return rows[0] || null;
}

export async function findActiveSubscription(userId) {
  const rows = await query(
    `SELECT s.id, s.plan_id, s.order_id, s.start_date, s.end_date, s.status,
            p.code AS plan_code, p.name AS plan_name
     FROM subscriptions s
     JOIN premium_plans p ON p.id = s.plan_id
     WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date > NOW()
     ORDER BY s.end_date DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function updateProfile(userId, { fullName, email, phoneNumber }) {
  await query(
    `UPDATE users
     SET full_name = ?, email = ?, phone_number = ?
     WHERE id = ?`,
    [fullName, email, phoneNumber || null, userId]
  );
}

export async function updateAvatar(userId, avatarPath) {
  await query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);
}

export async function updatePasswordAndRevokeSessions(conn, userId, newPasswordHash, actorEmail) {
  await conn.execute(
    'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
    [newPasswordHash, userId]
  );
  await conn.execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  );
  await conn.execute(
    `INSERT INTO activity_logs (user_id, actor_label, action_type, description, status)
     VALUES (?, ?, 'PASSWORD_CHANGE', 'Thành viên thay đổi mật khẩu tài khoản', 'Thành công')`,
    [userId, actorEmail]
  );
}
