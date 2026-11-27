import { pool, query } from '../../config/db.js';

export async function findMovieExists(movieId) {
  const rows = await query('SELECT id FROM movies WHERE id = ? AND status = 1 LIMIT 1', [movieId]);
  return rows[0] || null;
}

export async function getFavoriteCountsByType(userId) {
  const rows = await query(
    `SELECT m.type, COUNT(*) AS cnt
     FROM favorites f
     JOIN movies m ON m.id = f.movie_id
     WHERE f.user_id = ? AND m.status = 1
     GROUP BY m.type`,
    [userId]
  );

  let single = 0;
  let series = 0;
  for (const r of rows) {
    if (r.type === 'SINGLE') single = r.cnt;
    if (r.type === 'SERIES') series = r.cnt;
  }
  return { all: single + series, single, series };
}

export async function listFavoritesByUser(userId, { type, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 12);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = ['f.user_id = ?', 'm.status = 1'];
  const params = [userId];
  if (type && ['SINGLE', 'SERIES'].includes(type)) {
    where.push('m.type = ?');
    params.push(type);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [countRow] = await query(
    `SELECT COUNT(*) AS total
     FROM favorites f
     JOIN movies m ON m.id = f.movie_id
     ${whereSql}`,
    params
  );

  const items = await query(
    `SELECT f.id AS favorite_id, f.created_at AS favorited_at,
            m.id, m.name, m.origin_name, m.slug, m.poster_url, m.thumbnail_url,
            m.release_year, m.type, m.access_type, m.movie_status,
            m.total_episodes, m.current_episode_info, m.quality, m.rating_avg
     FROM favorites f
     JOIN movies m ON m.id = f.movie_id
     ${whereSql}
     ORDER BY f.created_at DESC, f.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

export async function addFavorite(userId, movieId) {
  await query('INSERT IGNORE INTO favorites (user_id, movie_id) VALUES (?, ?)', [userId, movieId]);
}

export async function removeFavorite(userId, movieId) {
  const [res] = await pool.execute('DELETE FROM favorites WHERE user_id = ? AND movie_id = ?', [
    userId,
    movieId,
  ]);
  return res.affectedRows > 0;
}

export async function clearAllFavorites(userId) {
  const [res] = await pool.execute('DELETE FROM favorites WHERE user_id = ?', [userId]);
  return res.affectedRows;
}
