import { query } from '../../config/db.js';

export async function findRoleByCode(code) {
  const rows = await query('SELECT id, code, name FROM roles WHERE code = ? LIMIT 1', [code]);
  return rows[0] || null;
}

export async function findUserByEmailOrUsername(email, username) {
  const rows = await query(
    'SELECT id, email, username FROM users WHERE email = ? OR username = ? LIMIT 1',
    [email, username]
  );
  return rows[0] || null;
}

export async function findUserForLogin(identifier) {
  const rows = await query(
    `SELECT u.id, u.role_id, u.username, u.email, u.password, u.full_name, u.phone_number,
            u.avatar, u.status, u.password_changed_at, u.created_at,
            r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? OR u.username = ?
     LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0] || null;
}

export async function findUserByIdWithRole(userId) {
  const rows = await query(
    `SELECT u.id, u.role_id, u.username, u.email, u.full_name, u.phone_number,
            u.avatar, u.status, u.password_changed_at, u.created_at,
            r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function findActiveUserByEmail(email) {
  const rows = await query(
    `SELECT id, username, email, full_name, status
     FROM users
     WHERE email = ? AND status = 1
     LIMIT 1`,
    [email]
  );
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

export async function createUser(conn, { roleId, username, email, passwordHash, fullName }) {
  const [result] = await conn.execute(
    `INSERT INTO users (role_id, username, email, password, full_name, status)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [roleId, username, email, passwordHash, fullName]
  );
  return result.insertId;
}

export async function insertRefreshToken(
  connOrPool,
  { userId, tokenHash, rememberMe, userAgent, ipAddress, expiresAt }
) {
  const executor = connOrPool || { execute: (sql, params) => query(sql, params) };
  if (connOrPool) {
    await connOrPool.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, remember_me, user_agent, ip_address, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, tokenHash, rememberMe ? 1 : 0, userAgent || null, ipAddress || null, expiresAt]
    );
    return;
  }
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, remember_me, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, tokenHash, rememberMe ? 1 : 0, userAgent || null, ipAddress || null, expiresAt]
  );
}

export async function findValidRefreshToken(tokenHash) {
  const rows = await query(
    `SELECT id, user_id, remember_me, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function revokeRefreshTokenById(conn, id) {
  await conn.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL', [id]);
}

export async function revokeRefreshTokenByHash(tokenHash) {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL', [
    tokenHash,
  ]);
}

export async function revokeAllUserRefreshTokens(conn, userId) {
  await conn.execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  );
}

export async function invalidateOldPasswordResetTokens(conn, userId) {
  await conn.execute(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId]
  );
}

export async function insertPasswordResetToken(conn, { userId, tokenHash, expiresAt }) {
  await conn.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findValidPasswordResetToken(tokenHash) {
  const rows = await query(
    `SELECT id, user_id, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function markPasswordResetTokenUsed(conn, id) {
  await conn.execute(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ? AND used_at IS NULL',
    [id]
  );
}

export async function updateUserPassword(conn, userId, passwordHash) {
  await conn.execute(
    'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
    [passwordHash, userId]
  );
}

export async function insertActivityLog(
  connOrNull,
  { userId = null, actorLabel, actionType, description, status, metadata = null }
) {
  const sql = `
    INSERT INTO activity_logs (user_id, actor_label, action_type, description, status, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    userId,
    actorLabel,
    actionType,
    description,
    status,
    metadata ? JSON.stringify(metadata) : null,
  ];
  if (connOrNull) {
    await connOrNull.execute(sql, params);
  } else {
    await query(sql, params);
  }
}
