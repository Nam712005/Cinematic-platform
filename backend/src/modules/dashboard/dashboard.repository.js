import { pool, query } from '../../config/db.js';

// ---------- DASHBOARD KPIs & 6-MONTH CHARTS (UI15) ----------
export async function getDashboardOverview() {
  const [
    [movieStats],
    [userStats],
    [premiumStats],
    [revenueStats],
    [interactionStats],
    revenueByMonth,
    viewsByMonth,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total_movies,
              COALESCE(SUM(view_count), 0) AS total_views,
              SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) THEN 1 ELSE 0 END) AS movies_this_month
       FROM movies`
    ),
    query(
      `SELECT COUNT(*) AS total_users,
              SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) THEN 1 ELSE 0 END) AS users_this_month
       FROM users`
    ),
    query(
      `SELECT COUNT(DISTINCT user_id) AS active_premium_users
       FROM subscriptions
       WHERE status = 'ACTIVE' AND end_date > NOW()`
    ),
    // Strictly PAID orders only — REFUNDED orders are excluded from revenue!
    query(
      `SELECT COALESCE(SUM(final_amount), 0) AS total_revenue,
              COALESCE(SUM(CASE WHEN YEAR(paid_at) = YEAR(NOW()) AND MONTH(paid_at) = MONTH(NOW()) THEN final_amount ELSE 0 END), 0) AS revenue_this_month,
              COUNT(*) AS total_paid_orders
       FROM orders
       WHERE status = 'PAID'`
    ),
    query(
      `SELECT (SELECT COUNT(*) FROM comments) AS total_comments,
              (SELECT COUNT(*) FROM comments WHERE status = 1) AS visible_comments,
              (SELECT COUNT(*) FROM ratings) AS total_ratings`
    ),
    query(
      `SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month_key,
              COALESCE(SUM(final_amount), 0) AS revenue
       FROM orders
       WHERE status = 'PAID' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
       ORDER BY month_key ASC`
    ),
    query(
      `SELECT DATE_FORMAT(last_watched_at, '%Y-%m') AS month_key,
              COUNT(*) AS watch_sessions
       FROM watch_histories
       WHERE last_watched_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(last_watched_at, '%Y-%m')
       ORDER BY month_key ASC`
    ),
  ]);

  const totalUsers = Number(userStats.total_users) || 0;
  const premiumUsers = Number(premiumStats.active_premium_users) || 0;
  const totalComments = Number(interactionStats.total_comments) || 0;
  const visibleComments = Number(interactionStats.visible_comments) || 0;
  const totalRatings = Number(interactionStats.total_ratings) || 0;

  return {
    kpis: {
      total_movies: Number(movieStats.total_movies) || 0,
      movies_this_month: Number(movieStats.movies_this_month) || 0,
      total_users: totalUsers,
      users_this_month: Number(userStats.users_this_month) || 0,
      total_views: Number(movieStats.total_views) || 0,
      premium_users: premiumUsers,
      premium_ratio_percent:
        totalUsers > 0 ? Number(((premiumUsers / totalUsers) * 100).toFixed(1)) : 0,
      total_revenue: Number(revenueStats.total_revenue) || 0,
      revenue_this_month: Number(revenueStats.revenue_this_month) || 0,
      total_comments_and_ratings: totalComments + totalRatings,
      moderation_approved_percent:
        totalComments > 0 ? Number(((visibleComments / totalComments) * 100).toFixed(1)) : 100,
    },
    charts: {
      revenue_6_months: revenueByMonth,
      views_6_months: viewsByMonth,
    },
  };
}

export async function listActivityLogs({ limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const [countRow] = await query('SELECT COUNT(*) AS total FROM activity_logs');
  const items = await query(
    `SELECT id, user_id, actor_label, action_type, description, status, metadata, created_at
     FROM activity_logs
     ORDER BY created_at DESC, id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );

  return { items, total: countRow.total };
}

// ---------- REPORTS & ANALYTICS BY RANGE (UI24) ----------
function resolveRangeDays(range) {
  switch (range) {
    case '7d':
      return 7;
    case '6m':
      return 180;
    case '1y':
      return 365;
    case '30d':
    default:
      return 30;
  }
}

export async function getReportsByRange(range = '30d') {
  const days = resolveRangeDays(range);
  const groupFmt = days > 60 ? '%Y-%m' : '%Y-%m-%d';

  const [
    [overviewUsers],
    [overviewMovies],
    [overviewRevenue],
    revenueSeries,
    newUsersSeries,
    viewsSeries,
    planDistribution,
    topMovies,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total_users,
              SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS new_users_in_range
       FROM users`,
      [days]
    ),
    query(
      `SELECT COUNT(*) AS total_movies,
              COALESCE(SUM(view_count), 0) AS total_views,
              SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS new_movies_in_range
       FROM movies`,
      [days]
    ),
    // Strictly PAID orders only for revenue — also track refunded count in range
    query(
      `SELECT COALESCE(SUM(CASE WHEN status = 'PAID' THEN final_amount ELSE 0 END), 0) AS range_revenue,
              SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_orders_count,
              SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) AS refunded_orders_count
       FROM orders
       WHERE COALESCE(paid_at, created_at) >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    ),
    query(
      `SELECT DATE_FORMAT(paid_at, '${groupFmt}') AS period,
              COALESCE(SUM(final_amount), 0) AS revenue,
              COUNT(*) AS orders_count
       FROM orders
       WHERE status = 'PAID' AND paid_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY period
       ORDER BY period ASC`,
      [days]
    ),
    query(
      `SELECT DATE_FORMAT(created_at, '${groupFmt}') AS period,
              COUNT(*) AS new_users
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY period
       ORDER BY period ASC`,
      [days]
    ),
    query(
      `SELECT DATE_FORMAT(last_watched_at, '${groupFmt}') AS period,
              COUNT(*) AS watch_count
       FROM watch_histories
       WHERE last_watched_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY period
       ORDER BY period ASC`,
      [days]
    ),
    query(
      `SELECT oi.plan_id, oi.plan_name, COUNT(*) AS orders_count,
              COALESCE(SUM(oi.total_price), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'PAID' AND o.paid_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY oi.plan_id, oi.plan_name
       ORDER BY orders_count DESC`,
      [days]
    ),
    query(
      `SELECT m.id, m.name, m.slug, m.release_year, m.view_count,
              GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres
       FROM movies m
       LEFT JOIN movie_genres mg ON mg.movie_id = m.id
       LEFT JOIN genres g ON g.id = mg.genre_id
       GROUP BY m.id
       ORDER BY m.view_count DESC, m.id ASC
       LIMIT 5`
    ),
  ]);

  const totalPlanOrders = planDistribution.reduce((acc, r) => acc + Number(r.orders_count || 0), 0);

  return {
    range,
    range_days: days,
    overview: {
      total_users: Number(overviewUsers.total_users) || 0,
      new_users_in_range: Number(overviewUsers.new_users_in_range) || 0,
      total_movies: Number(overviewMovies.total_movies) || 0,
      new_movies_in_range: Number(overviewMovies.new_movies_in_range) || 0,
      total_views: Number(overviewMovies.total_views) || 0,
      range_revenue: Number(overviewRevenue.range_revenue) || 0,
      paid_orders_count: Number(overviewRevenue.paid_orders_count) || 0,
      refunded_orders_count: Number(overviewRevenue.refunded_orders_count) || 0,
    },
    charts: {
      views_series: viewsSeries,
      revenue_series: revenueSeries,
      new_users_series: newUsersSeries,
      plan_distribution: planDistribution.map((p) => ({
        ...p,
        orders_count: Number(p.orders_count) || 0,
        revenue: Number(p.revenue) || 0,
        share_percent:
          totalPlanOrders > 0 ? Number(((Number(p.orders_count) / totalPlanOrders) * 100).toFixed(1)) : 0,
      })),
    },
    top_5_movies: topMovies.map((m, idx) => ({
      rank: idx + 1,
      ...m,
    })),
  };
}

// ---------- ADMIN NOTIFICATIONS (TOPBAR) ----------
export async function listNotificationsForUser(userId, { limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const [[countRow], [unreadRow], items] = await Promise.all([
    query('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?', [userId]),
    query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0', [userId]),
    query(
      `SELECT id, title, message, type, is_read, reference_type, reference_id, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userId]
    ),
  ]);

  return {
    items: items.map((n) => ({ ...n, is_read: Boolean(n.is_read) })),
    unread_count: Number(unreadRow.unread) || 0,
    total: Number(countRow.total) || 0,
  };
}

export async function markNotificationRead(userId, notificationId) {
  const [res] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return res.affectedRows > 0;
}

export async function markAllNotificationsRead(userId) {
  await query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
}
