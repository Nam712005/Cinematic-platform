import { pool, query } from '../../config/db.js';

export async function findRoleByCode(code) {
  const rows = await query('SELECT id, code, name FROM roles WHERE code = ? LIMIT 1', [code]);
  return rows[0] || null;
}

export async function listUsersAdmin({ q, accountType, status, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 12);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = [];
  const params = [];

  if (q) {
    where.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ? OR u.phone_number LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status !== undefined && status !== '' && ['0', '1'].includes(String(status))) {
    where.push('u.status = ?');
    params.push(Number(status));
  }
  if (accountType === 'PREMIUM') {
    where.push(
      `EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND s.end_date > NOW())`
    );
  } else if (accountType === 'STANDARD') {
    where.push(
      `r.code = 'MEMBER' AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND s.end_date > NOW())`
    );
  } else if (accountType === 'ADMIN') {
    where.push(`r.code = 'ADMIN'`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRow] = await query(
    `SELECT COUNT(*) AS total
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ${whereSql}`,
    params
  );

  const items = await query(
    `SELECT u.id, u.username, u.email, u.full_name, u.phone_number, u.avatar,
            u.status, u.is_email_verified, u.created_at, u.updated_at,
            r.code AS role_code, r.name AS role_name,
            EXISTS (
              SELECT 1 FROM subscriptions s
              WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND s.end_date > NOW()
            ) AS is_premium,
            (
              SELECT MAX(s.end_date) FROM subscriptions s
              WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND s.end_date > NOW()
            ) AS premium_end_date
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ${whereSql}
     ORDER BY CASE WHEN r.code = 'ADMIN' THEN 0 ELSE 1 END ASC, u.created_at DESC, u.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

export async function findUserDetailAdmin(userId) {
  const rows = await query(
    `SELECT u.id, u.role_id, u.username, u.email, u.full_name, u.phone_number, u.avatar,
            u.status, u.is_email_verified, u.password_changed_at, u.created_at, u.updated_at,
            r.code AS role_code, r.name AS role_name,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS total_orders,
            (SELECT COUNT(*) FROM watch_histories wh WHERE wh.user_id = u.id) AS total_watched,
            (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS total_comments
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return null;

  const subRows = await query(
    `SELECT s.id, s.plan_id, s.order_id, s.start_date, s.end_date, s.status, p.name AS plan_name
     FROM subscriptions s
     JOIN premium_plans p ON p.id = s.plan_id
     WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date > NOW()
     ORDER BY s.end_date DESC
     LIMIT 1`,
    [userId]
  );

  return {
    ...rows[0],
    is_premium: subRows.length > 0,
    active_subscription: subRows[0] || null,
  };
}

export async function createUserAdmin({ roleId, username, email, passwordHash, fullName, phoneNumber, status }) {
  const [res] = await pool.execute(
    `INSERT INTO users (role_id, username, email, password, full_name, phone_number, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [roleId, username, email, passwordHash, fullName, phoneNumber || null, status]
  );
  return res.insertId;
}

export async function updateUserAdmin(conn, userId, { fullName, email, phoneNumber, roleId, status, passwordHash }) {
  const sets = ['full_name = ?', 'email = ?', 'phone_number = ?'];
  const params = [fullName, email, phoneNumber || null];

  if (roleId !== undefined) {
    sets.push('role_id = ?');
    params.push(roleId);
  }
  if (status !== undefined) {
    sets.push('status = ?');
    params.push(status);
  }
  if (passwordHash) {
    sets.push('password = ?', 'password_changed_at = NOW()');
    params.push(passwordHash);
  }

  params.push(userId);
  await conn.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

  // If user is locked or password changed by admin, immediately revoke all active refresh tokens
  if (status === 0 || passwordHash) {
    await conn.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }
}

export async function setUserStatusAndRevokeTokens(conn, { userId, status, adminUser, targetEmail }) {
  await conn.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

  if (status === 0) {
    await conn.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }

  await conn.execute(
    `INSERT INTO activity_logs (user_id, actor_label, action_type, description, status, metadata)
     VALUES (?, ?, ?, ?, 'Hoàn tất', ?)`,
    [
      adminUser.id,
      adminUser.fullName || adminUser.email,
      status === 0 ? 'USER_LOCK' : 'USER_UNLOCK',
      status === 0 ? `Admin khóa tài khoản ${targetEmail}` : `Admin mở khóa tài khoản ${targetEmail}`,
      JSON.stringify({ targetUserId: userId, status }),
    ]
  );
}
