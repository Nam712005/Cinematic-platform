import { pool, query } from '../../config/db.js';

export async function findMovieById(movieId) {
  const rows = await query('SELECT id, name FROM movies WHERE id = ? AND status = 1 LIMIT 1', [movieId]);
  return rows[0] || null;
}

export async function createMovieReport({
  userId,
  movieId,
  episodeId,
  videoSourceId,
  reason,
  description,
}) {
  const [res] = await pool.execute(
    `INSERT INTO movie_reports (user_id, movie_id, episode_id, video_source_id, reason, description, status)
     VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
    [userId || null, movieId, episodeId || null, videoSourceId || null, reason, description || null]
  );

  // Notify active admins
  const admins = await query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'ADMIN' AND u.status = 1`
  );
  for (const admin of admins) {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
       VALUES (?, ?, ?, 'MOVIE_REPORT', 'movie_reports', ?)`,
      [
        admin.id,
        'Báo lỗi phát phim mới',
        `Có báo lỗi nguồn phát mới (${reason}) cho phim #${movieId}.`,
        res.insertId,
      ]
    );
  }

  const rows = await query('SELECT * FROM movie_reports WHERE id = ? LIMIT 1', [res.insertId]);
  return rows[0];
}

export async function listReportsAdmin({ status, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = status && ['OPEN', 'RESOLVED'].includes(status) ? 'WHERE mr.status = ?' : '';
  const params = where ? [status] : [];

  const [countRow] = await query(`SELECT COUNT(*) AS total FROM movie_reports mr ${where}`, params);
  const items = await query(
    `SELECT mr.*, m.name AS movie_name, m.slug AS movie_slug,
            e.episode_number, e.title AS episode_title,
            vs.source_name, u.username, u.email
     FROM movie_reports mr
     JOIN movies m ON m.id = mr.movie_id
     LEFT JOIN episodes e ON e.id = mr.episode_id
     LEFT JOIN video_sources vs ON vs.id = mr.video_source_id
     LEFT JOIN users u ON u.id = mr.user_id
     ${where}
     ORDER BY mr.created_at DESC, mr.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

export async function resolveReport(reportId) {
  const [res] = await pool.execute(
    `UPDATE movie_reports SET status = 'RESOLVED', resolved_at = NOW() WHERE id = ?`,
    [reportId]
  );
  if (res.affectedRows === 0) return null;
  const rows = await query('SELECT * FROM movie_reports WHERE id = ? LIMIT 1', [reportId]);
  return rows[0];
}
