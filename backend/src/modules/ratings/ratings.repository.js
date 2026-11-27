import { query } from '../../config/db.js';

export async function findMovieForRating(movieId) {
  const rows = await query(
    'SELECT id, name, rating_avg, rating_count FROM movies WHERE id = ? AND status = 1 LIMIT 1',
    [movieId]
  );
  return rows[0] || null;
}

export async function getRatingSummary(movieId) {
  const [summary] = await query(
    `SELECT COALESCE(ROUND(AVG(score), 2), 0.00) AS rating_avg,
            COUNT(*) AS rating_count
     FROM ratings
     WHERE movie_id = ?`,
    [movieId]
  );

  const distRows = await query(
    `SELECT score, COUNT(*) AS cnt
     FROM ratings
     WHERE movie_id = ?
     GROUP BY score`,
    [movieId]
  );

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of distRows) {
    distribution[r.score] = r.cnt;
  }

  return {
    rating_avg: Number(summary.rating_avg) || 0,
    rating_count: Number(summary.rating_count) || 0,
    distribution,
  };
}

export async function listRatingsByMovie(movieId, { limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const [countRow] = await query('SELECT COUNT(*) AS total FROM ratings WHERE movie_id = ?', [
    movieId,
  ]);

  const items = await query(
    `SELECT r.id, r.user_id, r.movie_id, r.score, r.review, r.created_at, r.updated_at,
            u.username, u.full_name, u.avatar
     FROM ratings r
     JOIN users u ON u.id = r.user_id
     WHERE r.movie_id = ?
     ORDER BY COALESCE(r.updated_at, r.created_at) DESC, r.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [movieId]
  );

  return { items, total: countRow.total };
}

export async function upsertRatingAndSyncMovie(conn, { userId, movieId, score, review }) {
  await conn.execute(
    `INSERT INTO ratings (user_id, movie_id, score, review)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       score = VALUES(score),
       review = VALUES(review),
       updated_at = NOW()`,
    [userId, movieId, score, review || null]
  );

  const [aggRows] = await conn.execute(
    `SELECT COALESCE(ROUND(AVG(score), 2), 0.00) AS rating_avg,
            COUNT(*) AS rating_count
     FROM ratings
     WHERE movie_id = ?`,
    [movieId]
  );
  const { rating_avg, rating_count } = aggRows[0];

  await conn.execute('UPDATE movies SET rating_avg = ?, rating_count = ? WHERE id = ?', [
    rating_avg,
    rating_count,
    movieId,
  ]);

  const [myRows] = await conn.execute(
    'SELECT id, user_id, movie_id, score, review, created_at, updated_at FROM ratings WHERE user_id = ? AND movie_id = ? LIMIT 1',
    [userId, movieId]
  );

  return {
    rating: myRows[0],
    rating_avg: Number(rating_avg) || 0,
    rating_count: Number(rating_count) || 0,
  };
}
