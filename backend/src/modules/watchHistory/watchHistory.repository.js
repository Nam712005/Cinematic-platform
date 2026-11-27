import { pool, query } from '../../config/db.js';

export async function findEpisodeOwnership(movieId, episodeId) {
  const rows = await query(
    'SELECT id, movie_id, episode_number, title, slug FROM episodes WHERE id = ? AND movie_id = ? LIMIT 1',
    [episodeId, movieId]
  );
  return rows[0] || null;
}

export async function listWatchHistoriesByUser(userId, { limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 12);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const [countRow] = await query(
    'SELECT COUNT(*) AS total FROM watch_histories WHERE user_id = ?',
    [userId]
  );

  const items = await query(
    `SELECT wh.id, wh.user_id, wh.movie_id, wh.episode_id,
            wh.started_at, wh.last_watched_at, wh.stopped_at_seconds,
            wh.duration_seconds, wh.progress_percent, wh.watch_status, wh.completed_at,
            m.name AS movie_name, m.origin_name, m.slug AS movie_slug,
            m.banner_url, m.poster_url, m.thumbnail_url, m.type AS movie_type, m.access_type,
            e.episode_number, e.title AS episode_title, e.slug AS episode_slug
     FROM watch_histories wh
     JOIN movies m ON m.id = wh.movie_id
     JOIN episodes e ON e.id = wh.episode_id
     WHERE wh.user_id = ?
     ORDER BY wh.last_watched_at DESC, wh.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [userId]
  );

  return { items, total: countRow.total };
}

export async function findUserEpisodeProgress(userId, episodeId) {
  const rows = await query(
    `SELECT wh.id, wh.user_id, wh.movie_id, wh.episode_id,
            wh.started_at, wh.last_watched_at, wh.stopped_at_seconds,
            wh.duration_seconds, wh.progress_percent, wh.watch_status, wh.completed_at,
            e.episode_number, e.title AS episode_title, e.slug AS episode_slug
     FROM watch_histories wh
     JOIN episodes e ON e.id = wh.episode_id
     WHERE wh.user_id = ? AND wh.episode_id = ?
     LIMIT 1`,
    [userId, episodeId]
  );
  return rows[0] || null;
}

export async function upsertWatchProgress({
  userId,
  movieId,
  episodeId,
  stoppedAtSeconds,
  durationSeconds,
  progressPercent,
  watchStatus,
  completedAt,
}) {
  await query(
    `INSERT INTO watch_histories (
       user_id, movie_id, episode_id,
       started_at, last_watched_at, stopped_at_seconds,
       duration_seconds, progress_percent, watch_status, completed_at
     )
     VALUES (?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       movie_id = VALUES(movie_id),
       last_watched_at = NOW(),
       stopped_at_seconds = VALUES(stopped_at_seconds),
       duration_seconds = VALUES(duration_seconds),
       progress_percent = VALUES(progress_percent),
       watch_status = VALUES(watch_status),
       completed_at = VALUES(completed_at)`,
    [
      userId,
      movieId,
      episodeId,
      stoppedAtSeconds,
      durationSeconds,
      progressPercent,
      watchStatus,
      completedAt,
    ]
  );

  return findUserEpisodeProgress(userId, episodeId);
}

export async function deleteWatchHistoryById(userId, id) {
  const [res] = await pool.execute('DELETE FROM watch_histories WHERE id = ? AND user_id = ?', [
    id,
    userId,
  ]);
  return res.affectedRows > 0;
}

export async function clearAllWatchHistories(userId) {
  const [res] = await pool.execute('DELETE FROM watch_histories WHERE user_id = ?', [userId]);
  return res.affectedRows;
}
