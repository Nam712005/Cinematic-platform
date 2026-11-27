import { pool, query } from '../../config/db.js';

export async function listPublicPlans() {
  return query(
    `SELECT id, code, name, duration_days, price, original_price, description, features, is_popular, status
     FROM premium_plans
     WHERE status = 1
     ORDER BY duration_days ASC, id ASC`
  );
}

export async function findActivePlanById(planId) {
  const rows = await query(
    'SELECT * FROM premium_plans WHERE id = ? AND status = 1 LIMIT 1',
    [planId]
  );
  return rows[0] || null;
}

export async function findPlanById(planId) {
  const rows = await query('SELECT * FROM premium_plans WHERE id = ? LIMIT 1', [planId]);
  return rows[0] || null;
}

export async function getPaymentBankDisplaySettings() {
  const rows = await query(
    `SELECT setting_key, setting_value
     FROM system_settings
     WHERE setting_group = 'PAYMENT' AND is_encrypted = 0`
  );
  const map = {};
  for (const r of rows) map[r.setting_key] = r.setting_value;
  return map;
}

export async function getMaxActiveSubscriptionEnd(userId, conn = null) {
  const sql = `
    SELECT MAX(end_date) AS max_end_date
    FROM subscriptions
    WHERE user_id = ? AND status = 'ACTIVE' AND end_date > NOW()
    ${conn ? 'FOR UPDATE' : ''}
  `;
  if (conn) {
    const [rows] = await conn.execute(sql, [userId]);
    return rows[0]?.max_end_date || null;
  }
  const rows = await query(sql, [userId]);
  return rows[0]?.max_end_date || null;
}

export async function findOrderByIdempotencyKey(conn, idempotencyKey) {
  const [rows] = await conn.execute(
    'SELECT id, order_code, user_id, status FROM orders WHERE idempotency_key = ? LIMIT 1 FOR UPDATE',
    [idempotencyKey]
  );
  return rows[0] || null;
}

export async function findActivePlanForUpdate(conn, planId) {
  const [rows] = await conn.execute(
    'SELECT * FROM premium_plans WHERE id = ? AND status = 1 LIMIT 1 FOR UPDATE',
    [planId]
  );
  return rows[0] || null;
}

export async function createPaidOrderTransaction(
  conn,
  {
    orderCode,
    transactionNo,
    idempotencyKey,
    userId,
    userEmail,
    plan,
    paymentMethod,
    qrPayload,
    note,
  }
) {
  const price = Number(plan.price);
  const durationDays = Number(plan.duration_days);

  // 1. Insert orders with explicit 'PAID' (NO pending state)
  const [orderRes] = await conn.execute(
    `INSERT INTO orders (
       order_code, idempotency_key, user_id, total_amount, discount_amount,
       final_amount, status, payment_method, note, paid_at
     ) VALUES (?, ?, ?, ?, 0.00, ?, 'PAID', ?, ?, NOW())`,
    [orderCode, idempotencyKey, userId, price, price, paymentMethod, note || null]
  );
  const orderId = orderRes.insertId;

  // 2. Insert order_items snapshot (preserves historical price & plan name/duration)
  await conn.execute(
    `INSERT INTO order_items (
       order_id, plan_id, plan_name, duration_days, price, quantity, total_price
     ) VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [orderId, plan.id, plan.name, durationDays, price, price]
  );

  // 3. Insert payments with explicit 'PAID'
  await conn.execute(
    `INSERT INTO payments (
       order_id, transaction_no, provider, amount, payment_status, qr_payload, paid_at
     ) VALUES (?, ?, ?, ?, 'PAID', ?, NOW())`,
    [orderId, transactionNo, paymentMethod, price, qrPayload || null]
  );

  // 4. Subscription chaining rule: start right after MAX(end_date) of ACTIVE subs, else NOW()
  const maxActiveEnd = await getMaxActiveSubscriptionEnd(userId, conn);
  if (maxActiveEnd) {
    await conn.execute(
      `INSERT INTO subscriptions (user_id, plan_id, order_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), 'ACTIVE')`,
      [userId, plan.id, orderId, maxActiveEnd, maxActiveEnd, durationDays]
    );
  } else {
    await conn.execute(
      `INSERT INTO subscriptions (user_id, plan_id, order_id, start_date, end_date, status)
       VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 'ACTIVE')`,
      [userId, plan.id, orderId, durationDays]
    );
  }

  // 5. Activity log & Admin notifications
  await conn.execute(
    `INSERT INTO activity_logs (user_id, actor_label, action_type, description, status, metadata)
     VALUES (?, ?, 'PREMIUM_PURCHASE', ?, 'Đã thanh toán', ?)`,
    [
      userId,
      userEmail,
      `Người dùng đăng ký ${plan.name}`,
      JSON.stringify({ orderCode, transactionNo, amount: price, paymentMethod }),
    ]
  );

  const [admins] = await conn.execute(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'ADMIN' AND u.status = 1`
  );
  for (const admin of admins) {
    await conn.execute(
      `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
       VALUES (?, ?, ?, 'NEW_ORDER', 'orders', ?)`,
      [
        admin.id,
        'Đơn hàng Premium mới',
        `${userEmail} vừa thanh toán ${plan.name} (${price.toLocaleString('vi-VN')}đ).`,
        orderId,
      ]
    );
  }

  return orderId;
}

export async function findOrderDetailByCode(orderCode) {
  const rows = await query(
    `SELECT o.id AS order_id, o.order_code, o.user_id, o.total_amount, o.discount_amount,
            o.final_amount, o.status AS order_status, o.payment_method, o.note, o.paid_at, o.created_at,
            oi.plan_id, oi.plan_name, oi.duration_days, oi.price AS item_price, oi.quantity, oi.total_price,
            p.id AS payment_id, p.transaction_no, p.provider, p.amount AS paid_amount,
            p.payment_status, p.qr_payload, p.refunded_at, p.refunded_by, p.refund_reason,
            s.id AS subscription_id, s.start_date, s.end_date, s.status AS subscription_status,
            s.revoked_at,
            u.email AS user_email, u.full_name AS user_full_name
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN payments p ON p.order_id = o.id
     JOIN subscriptions s ON s.order_id = o.id
     JOIN users u ON u.id = o.user_id
     WHERE o.order_code = ?
     LIMIT 1`,
    [orderCode]
  );
  return rows[0] || null;
}

export async function listMemberOrders(userId, { filter, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  // Sync expired subscriptions lazily for accurate display
  await query(
    `UPDATE subscriptions SET status = 'EXPIRED'
     WHERE user_id = ? AND status = 'ACTIVE' AND end_date <= NOW()`,
    [userId]
  );

  const where = ['o.user_id = ?'];
  const params = [userId];

  if (filter === 'active') {
    where.push("s.status = 'ACTIVE' AND s.end_date > NOW()");
  } else if (filter === 'expired') {
    where.push("(s.status = 'EXPIRED' OR (s.status = 'ACTIVE' AND s.end_date <= NOW()))");
  } else if (filter === 'refunded') {
    where.push("o.status = 'REFUNDED'");
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [countRow] = await query(
    `SELECT COUNT(*) AS total
     FROM orders o
     JOIN subscriptions s ON s.order_id = o.id
     ${whereSql}`,
    params
  );

  const items = await query(
    `SELECT o.id AS order_id, o.order_code, o.final_amount, o.status AS order_status,
            o.payment_method, o.paid_at, o.created_at,
            oi.plan_id, oi.plan_name, oi.duration_days, oi.price AS historical_price,
            p.transaction_no, p.payment_status, p.refunded_at, p.refund_reason,
            s.id AS subscription_id, s.start_date, s.end_date, s.status AS subscription_status,
            s.revoked_at
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN payments p ON p.order_id = o.id
     JOIN subscriptions s ON s.order_id = o.id
     ${whereSql}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

// ---------- ADMIN PLANS (UI20) ----------
export async function listPlansAdmin({ q, status, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = [];
  const params = [];
  if (q) {
    where.push('(name LIKE ? OR code LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status !== undefined && status !== '' && ['0', '1'].includes(String(status))) {
    where.push('status = ?');
    params.push(Number(status));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRow] = await query(`SELECT COUNT(*) AS total FROM premium_plans ${whereSql}`, params);
  const items = await query(
    `SELECT * FROM premium_plans ${whereSql} ORDER BY duration_days ASC, id ASC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

export async function createPlan(conn, data) {
  const executor = conn || pool;
  if (data.is_popular) {
    await executor.execute('UPDATE premium_plans SET is_popular = 0');
  }
  const [res] = await executor.execute(
    `INSERT INTO premium_plans (code, name, duration_days, price, original_price, description, features, status, is_popular)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code,
      data.name,
      data.duration_days,
      data.price,
      data.original_price ?? null,
      data.description || null,
      data.featuresJson,
      data.status,
      data.is_popular ? 1 : 0,
    ]
  );
  return res.insertId;
}

export async function updatePlan(conn, id, data) {
  const executor = conn || pool;
  if (data.is_popular) {
    await executor.execute('UPDATE premium_plans SET is_popular = 0 WHERE id <> ?', [id]);
  }
  await executor.execute(
    `UPDATE premium_plans
     SET code = ?, name = ?, duration_days = ?, price = ?, original_price = ?,
         description = ?, features = ?, status = ?, is_popular = ?
     WHERE id = ?`,
    [
      data.code,
      data.name,
      data.duration_days,
      data.price,
      data.original_price ?? null,
      data.description || null,
      data.featuresJson,
      data.status,
      data.is_popular ? 1 : 0,
      id,
    ]
  );
}

export async function setPopularPlan(conn, id) {
  await conn.execute('UPDATE premium_plans SET is_popular = 0');
  await conn.execute('UPDATE premium_plans SET is_popular = 1 WHERE id = ?', [id]);
}

export async function deletePlan(id) {
  const [res] = await pool.execute('DELETE FROM premium_plans WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// ---------- ADMIN TRANSACTIONS & SIMULATED REFUND (UI21) ----------
export async function listTransactionsAdmin({ q, provider, status, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = [];
  const params = [];
  if (q) {
    where.push('(p.transaction_no LIKE ? OR o.order_code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (provider && ['ZALOPAY', 'MOMO', 'BANK_TRANSFER'].includes(provider)) {
    where.push('p.provider = ?');
    params.push(provider);
  }
  if (status && ['PAID', 'REFUNDED'].includes(status)) {
    where.push('p.payment_status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRow] = await query(
    `SELECT COUNT(*) AS total
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN users u ON u.id = o.user_id
     ${whereSql}`,
    params
  );

  const items = await query(
    `SELECT p.id AS payment_id, p.transaction_no, p.provider, p.amount, p.payment_status,
            p.paid_at, p.refunded_at, p.refunded_by, p.refund_reason,
            o.id AS order_id, o.order_code, o.final_amount, o.payment_method, o.status AS order_status,
            oi.plan_name, oi.duration_days, oi.price AS historical_price,
            s.id AS subscription_id, s.start_date, s.end_date, s.status AS subscription_status,
            u.id AS user_id, u.full_name AS user_full_name, u.email AS user_email,
            adm.full_name AS refunded_by_name, adm.email AS refunded_by_email
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN subscriptions s ON s.order_id = o.id
     JOIN users u ON u.id = o.user_id
     LEFT JOIN users adm ON adm.id = p.refunded_by
     ${whereSql}
     ORDER BY p.paid_at DESC, p.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

export async function findTransactionDetailById(paymentId) {
  const rows = await query(
    `SELECT p.id AS payment_id, p.transaction_no, p.provider, p.amount, p.payment_status,
            p.qr_payload, p.paid_at, p.refunded_at, p.refunded_by, p.refund_reason,
            o.id AS order_id, o.order_code, o.status AS order_status, o.final_amount,
            oi.plan_id, oi.plan_name, oi.duration_days, oi.price AS historical_price,
            s.id AS subscription_id, s.start_date, s.end_date, s.status AS subscription_status,
            s.revoked_at, s.revoked_by,
            u.id AS user_id, u.full_name AS user_full_name, u.email AS user_email,
            adm.full_name AS refunded_by_name, adm.email AS refunded_by_email
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN subscriptions s ON s.order_id = o.id
     JOIN users u ON u.id = o.user_id
     LEFT JOIN users adm ON adm.id = p.refunded_by
     WHERE p.id = ?
     LIMIT 1`,
    [paymentId]
  );
  return rows[0] || null;
}

export async function lockPaymentForRefund(conn, paymentId) {
  const [rows] = await conn.execute(
    `SELECT p.id, p.order_id, p.transaction_no, p.amount, p.payment_status, o.order_code, o.user_id
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE p.id = ?
     LIMIT 1
     FOR UPDATE`,
    [paymentId]
  );
  return rows[0] || null;
}

export async function executeSimulatedRefund(conn, { paymentRow, adminUser, refundReason }) {
  // 1. Update orders.status -> REFUNDED
  await conn.execute(
    `UPDATE orders SET status = 'REFUNDED' WHERE id = ? AND status = 'PAID'`,
    [paymentRow.order_id]
  );

  // 2. Update payments (single source of truth for refund metadata)
  await conn.execute(
    `UPDATE payments
     SET payment_status = 'REFUNDED',
         refunded_at = NOW(),
         refunded_by = ?,
         refund_reason = ?
     WHERE id = ? AND payment_status = 'PAID'`,
    [adminUser.id, refundReason, paymentRow.id]
  );

  // 3. Revoke ONLY the exact subscription belonging to this order_id (independent of other active plans)
  await conn.execute(
    `UPDATE subscriptions
     SET status = 'REVOKED',
         revoked_at = NOW(),
         revoked_by = ?
     WHERE order_id = ? AND status <> 'REVOKED'`,
    [adminUser.id, paymentRow.order_id]
  );

  // 4. Activity log audit trail
  await conn.execute(
    `INSERT INTO activity_logs (user_id, actor_label, action_type, description, status, metadata)
     VALUES (?, ?, 'PAYMENT_REFUND', ?, 'Đã hoàn tiền', ?)`,
    [
      adminUser.id,
      adminUser.fullName || adminUser.email,
      `Admin hoàn tiền giao dịch ${paymentRow.transaction_no} (${paymentRow.order_code})`,
      JSON.stringify({
        paymentId: paymentRow.id,
        orderId: paymentRow.order_id,
        orderCode: paymentRow.order_code,
        amount: paymentRow.amount,
        refundReason,
      }),
    ]
  );
}
