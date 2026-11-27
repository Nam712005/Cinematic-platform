import { pool, query } from '../../config/db.js';

export async function findMovieSummary(movieId) {
  const rows = await query('SELECT id, name, slug, type FROM movies WHERE id = ? LIMIT 1', [movieId]);
  return rows[0] || null;
}

export async function listEpisodesByMovie(movieId, { limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const [countRow] = await query('SELECT COUNT(*) AS total FROM episodes WHERE movie_id = ?', [movieId]);
  const items = await query(
    `SELECT e.*, COUNT(vs.id) AS source_count
     FROM episodes e
     LEFT JOIN video_sources vs ON vs.episode_id = e.id
     WHERE e.movie_id = ?
     GROUP BY e.id
     ORDER BY e.episode_number ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [movieId]
  );

  if (items.length > 0) {
    const epIds = items.map((e) => e.id);
    const placeholders = epIds.map(() => '?').join(',');
    const sourceRows = await query(
      `SELECT * FROM video_sources
       WHERE episode_id IN (${placeholders})
       ORDER BY is_default DESC, id ASC`,
      epIds
    );
    const sourceMap = new Map();
    for (const s of sourceRows) {
      if (!sourceMap.has(s.episode_id)) sourceMap.set(s.episode_id, []);
      sourceMap.get(s.episode_id).push({
        ...s,
        source_code: `SRC${String(s.id).padStart(3, '0')}`,
        is_default: Boolean(s.is_default),
      });
    }
    for (const ep of items) {
      ep.sources = sourceMap.get(ep.id) || [];
    }
  }

  return { items, total: countRow.total };
}

export async function findEpisodeById(id) {
  const rows = await query('SELECT * FROM episodes WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createEpisode(movieId, { episode_number, title, slug, duration_seconds, status, release_date }) {
  const [res] = await pool.execute(
    `INSERT INTO episodes (movie_id, episode_number, title, slug, duration_seconds, status, release_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [movieId, episode_number, title || null, slug, duration_seconds || null, status, release_date || null]
  );
  return findEpisodeById(res.insertId);
}

export async function updateEpisode(id, { episode_number, title, slug, duration_seconds, status, release_date }) {
  await query(
    `UPDATE episodes
     SET episode_number = ?, title = ?, slug = ?, duration_seconds = ?, status = ?, release_date = ?
     WHERE id = ?`,
    [episode_number, title || null, slug, duration_seconds || null, status, release_date || null, id]
  );
  return findEpisodeById(id);
}

export async function deleteEpisode(id) {
  const [res] = await pool.execute('DELETE FROM episodes WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// ---------- VIDEO SOURCES ----------
export async function listSourcesByEpisode(episodeId) {
  return query(
    `SELECT * FROM video_sources
     WHERE episode_id = ?
     ORDER BY is_default DESC, id ASC`,
    [episodeId]
  );
}

export async function findSourceById(id) {
  const rows = await query('SELECT * FROM video_sources WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createSource(conn, episodeId, data) {
  if (data.is_default) {
    await conn.execute('UPDATE video_sources SET is_default = 0 WHERE episode_id = ?', [episodeId]);
  }
  const [res] = await conn.execute(
    `INSERT INTO video_sources (episode_id, source_name, video_url, quality, format_type, is_default, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      episodeId,
      data.source_name,
      data.video_url,
      data.quality,
      data.format_type,
      data.is_default ? 1 : 0,
      data.status,
    ]
  );
  return res.insertId;
}

export async function updateSource(conn, id, episodeId, data) {
  if (data.is_default) {
    await conn.execute('UPDATE video_sources SET is_default = 0 WHERE episode_id = ? AND id <> ?', [
      episodeId,
      id,
    ]);
  }
  await conn.execute(
    `UPDATE video_sources
     SET source_name = ?, video_url = ?, quality = ?, format_type = ?, is_default = ?, status = ?
     WHERE id = ?`,
    [
      data.source_name,
      data.video_url,
      data.quality,
      data.format_type,
      data.is_default ? 1 : 0,
      data.status,
      id,
    ]
  );
}

export async function deleteSource(id) {
  const [res] = await pool.execute('DELETE FROM video_sources WHERE id = ?', [id]);
  return res.affectedRows > 0;
}
