import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './dashboard.repository.js';

export async function getDashboardData() {
  const [overview, recent] = await Promise.all([
    repo.getDashboardOverview(),
    repo.listActivityLogs({ limit: 10, offset: 0 }),
  ]);

  return {
    ...overview,
    recent_activities: recent.items,
  };
}

export async function getActivityLogs(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 10, 100);
  const { items, total } = await repo.listActivityLogs({ limit, offset });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function getReportsData(range) {
  const validRange = ['7d', '30d', '6m', '1y'].includes(range) ? range : '30d';
  return repo.getReportsByRange(validRange);
}

export async function getMyNotifications(userId, queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 20, 50);
  const { items, unread_count, total } = await repo.listNotificationsForUser(userId, { limit, offset });
  return {
    unread_count,
    items,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function markNotificationRead(userId, notificationId) {
  const ok = await repo.markNotificationRead(userId, notificationId);
  if (!ok) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo.');
  }
}

export async function markAllNotificationsRead(userId) {
  await repo.markAllNotificationsRead(userId);
}
