import { pool, query } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';

async function attachGenresAndCountries(movies) {
  if (!movies.length) return movies;
  const ids = movies.map((m) => m.id);
  const placeholders = ids.map(() => '?').join(',');

  const [genreRows, countryRows] = await Promise.all([
    query(
      `SELECT mg.movie_id, g.id, g.name, g.slug
       FROM movie_genres mg
       JOIN genres g ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${placeholders})`,
      ids
    ),
    query(
      `SELECT mc.movie_id, c.id, c.code, c.name, c.slug
       FROM movie_countries mc
       JOIN countries c ON c.id = mc.country_id
       WHERE mc.movie_id IN (${placeholders})`,
      ids
    ),
  ]);

  const genreMap = new Map();
  for (const row of genreRows) {
    if (!genreMap.has(row.movie_id)) genreMap.set(row.movie_id, []);
    genreMap.get(row.movie_id).push({ id: row.id, name: row.name, slug: row.slug });
  }

  const countryMap = new Map();
  for (const row of countryRows) {
    if (!countryMap.has(row.movie_id)) countryMap.set(row.movie_id, []);
    countryMap.get(row.movie_id).push({ id: row.id, code: row.code, name: row.name, slug: row.slug });
  }

  return movies.map((m) => ({
    ...m,
    is_featured: Boolean(m.is_featured),
    genres: genreMap.get(m.id) || [],
    countries: countryMap.get(m.id) || [],
  }));
}

const CARD_COLUMNS = `
  m.id, m.api_id, m.external_source, m.name, m.origin_name, m.slug, m.description,
  m.poster_url, m.thumbnail_url, m.banner_url, m.release_year, m.type, m.access_type,
  m.movie_status, m.duration_minutes, m.total_episodes, m.current_episode_info,
  m.quality, m.language, m.rating_avg, m.rating_count, m.view_count, m.like_count,
  m.status, m.is_featured, m.created_at, m.updated_at
`;

// ---------- PUBLIC HOME (UI01) ----------
export async function getHomeSections() {
  const [featuredRows, latestRows, singleRows, seriesRows, topViewRows] = await Promise.all([
    query(
      `SELECT ${CARD_COLUMNS} FROM movies m
       WHERE m.status = 1 AND m.is_featured = 1
       ORDER BY m.updated_at DESC, m.id DESC
       LIMIT 5`
    ),
    query(
      `SELECT ${CARD_COLUMNS} FROM movies m
       WHERE m.status = 1
       ORDER BY COALESCE(m.updated_at, m.created_at) DESC, m.id DESC
       LIMIT 10`
    ),
    query(
      `SELECT ${CARD_COLUMNS} FROM movies m
       WHERE m.status = 1 AND m.type = 'SINGLE'
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 10`
    ),
    query(
      `SELECT ${CARD_COLUMNS} FROM movies m
       WHERE m.status = 1 AND m.type = 'SERIES'
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 10`
    ),
    query(
      `SELECT ${CARD_COLUMNS} FROM movies m
       WHERE m.status = 1
       ORDER BY m.view_count DESC, m.rating_avg DESC, m.id DESC
       LIMIT 10`
    ),
  ]);

  let spotlight = featuredRows;
  if (spotlight.length === 0 && latestRows.length > 0) {
    spotlight = [latestRows[0]];
  }

  const [featured, latest, singleMovies, seriesMovies, mostViewed] = await Promise.all([
    attachGenresAndCountries(spotlight),
    attachGenresAndCountries(latestRows),
    attachGenresAndCountries(singleRows),
    attachGenresAndCountries(seriesRows),
    attachGenresAndCountries(topViewRows),
  ]);

  return {
    featured,
    latest,
    single_movies: singleMovies,
    series_movies: seriesMovies,
    most_viewed: mostViewed,
  };
}

// ---------- PUBLIC SEARCH & FILTER (UI04) ----------
export async function searchPublicMovies({
  q,
  genre,
  country,
  category,
  year,
  movie_status,
  type,
  access_type,
  sort,
  limit,
  offset,
}) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 12);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const joins = [];
  const where = ['m.status = 1'];
  const params = [];

  if (q) {
    where.push('(m.name LIKE ? OR m.origin_name LIKE ? OR m.slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (genre) {
    joins.push('JOIN movie_genres mg ON mg.movie_id = m.id JOIN genres g ON g.id = mg.genre_id');
    if (/^\d+$/.test(String(genre))) {
      where.push('g.id = ?');
      params.push(Number(genre));
    } else {
      where.push('g.slug = ?');
      params.push(genre);
    }
  }
  if (country) {
    joins.push('JOIN movie_countries mco ON mco.movie_id = m.id JOIN countries co ON co.id = mco.country_id');
    if (/^\d+$/.test(String(country))) {
      where.push('co.id = ?');
      params.push(Number(country));
    } else {
      where.push('co.slug = ?');
      params.push(country);
    }
  }
  if (category) {
    joins.push('JOIN movie_categories mcat ON mcat.movie_id = m.id JOIN categories cat ON cat.id = mcat.category_id');
    if (/^\d+$/.test(String(category))) {
      where.push('cat.id = ?');
      params.push(Number(category));
    } else {
      where.push('cat.slug = ?');
      params.push(category);
    }
  }
  if (year && /^\d{4}$/.test(String(year))) {
    where.push('m.release_year = ?');
    params.push(Number(year));
  }
  if (movie_status && ['ONGOING', 'COMPLETED', 'UPCOMING'].includes(movie_status)) {
    where.push('m.movie_status = ?');
    params.push(movie_status);
  }
  if (type && ['SINGLE', 'SERIES'].includes(type)) {
    where.push('m.type = ?');
    params.push(type);
  }
  if (access_type && ['FREE', 'PREMIUM'].includes(access_type)) {
    where.push('m.access_type = ?');
    params.push(access_type);
  }

  let orderBy = 'COALESCE(m.updated_at, m.created_at) DESC, m.id DESC';
  if (sort === 'most_viewed') orderBy = 'm.view_count DESC, m.id DESC';
  else if (sort === 'top_rated') orderBy = 'm.rating_avg DESC, m.rating_count DESC, m.id DESC';
  else if (sort === 'year_desc') orderBy = 'm.release_year DESC, m.id DESC';
  else if (sort === 'oldest') orderBy = 'm.created_at ASC, m.id ASC';

  const joinSql = joins.join(' ');
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [countRow] = await query(
    `SELECT COUNT(DISTINCT m.id) AS total FROM movies m ${joinSql} ${whereSql}`,
    params
  );

  const rows = await query(
    `SELECT DISTINCT ${CARD_COLUMNS}
     FROM movies m
     ${joinSql}
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const items = await attachGenresAndCountries(rows);
  return { items, total: countRow.total };
}

// ---------- DETAIL & WATCH (UI05, UI06) ----------
export async function findMovieBySlug(slug, { includeHidden = false } = {}) {
  const statusCond = includeHidden ? '' : 'AND m.status = 1';
  const rows = await query(
    `SELECT ${CARD_COLUMNS}, m.tmdb_id, m.imdb_id
     FROM movies m
     WHERE m.slug = ? ${statusCond}
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export async function findMovieById(id) {
  const rows = await query(
    `SELECT ${CARD_COLUMNS}, m.tmdb_id, m.imdb_id
     FROM movies m
     WHERE m.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findMovieFullRelations(movieId, { includeHiddenEpisodes = false } = {}) {
  const epStatus = includeHiddenEpisodes ? '' : 'AND status = 1';
  const [genres, countries, categories, actors, directors, episodes] = await Promise.all([
    query(
      `SELECT g.id, g.name, g.slug
       FROM movie_genres mg JOIN genres g ON g.id = mg.genre_id
       WHERE mg.movie_id = ?`,
      [movieId]
    ),
    query(
      `SELECT c.id, c.code, c.name, c.slug
       FROM movie_countries mc JOIN countries c ON c.id = mc.country_id
       WHERE mc.movie_id = ?`,
      [movieId]
    ),
    query(
      `SELECT cat.id, cat.name, cat.slug
       FROM movie_categories mcat JOIN categories cat ON cat.id = mcat.category_id
       WHERE mcat.movie_id = ?`,
      [movieId]
    ),
    query(
      `SELECT a.id, a.name, a.slug, a.avatar, ma.character_name
       FROM movie_actors ma JOIN actors a ON a.id = ma.actor_id
       WHERE ma.movie_id = ?`,
      [movieId]
    ),
    query(
      `SELECT d.id, d.name, d.slug, d.avatar
       FROM movie_directors md JOIN directors d ON d.id = md.director_id
       WHERE md.movie_id = ?`,
      [movieId]
    ),
    query(
      `SELECT id, movie_id, episode_number, title, slug, duration_seconds, status, release_date
       FROM episodes
       WHERE movie_id = ? ${epStatus}
       ORDER BY episode_number ASC`,
      [movieId]
    ),
  ]);

  return { genres, countries, categories, actors, directors, episodes };
}

export async function findUserMovieInteraction(userId, movieId) {
  const [favRows, ratingRows] = await Promise.all([
    query('SELECT id FROM favorites WHERE user_id = ? AND movie_id = ? LIMIT 1', [userId, movieId]),
    query('SELECT score, review, updated_at FROM ratings WHERE user_id = ? AND movie_id = ? LIMIT 1', [
      userId,
      movieId,
    ]),
  ]);

  return {
    is_favorited: favRows.length > 0,
    user_rating: ratingRows[0] || null,
  };
}

export async function findEpisodeForWatch(movieId, episodeSlug) {
  const rows = await query(
    `SELECT id, movie_id, episode_number, title, slug, duration_seconds, status, release_date
     FROM episodes
     WHERE movie_id = ? AND slug = ? AND status = 1
     LIMIT 1`,
    [movieId, episodeSlug]
  );
  return rows[0] || null;
}

export async function findActiveVideoSources(episodeId) {
  return query(
    `SELECT id, episode_id, source_name, video_url, quality, format_type, is_default
     FROM video_sources
     WHERE episode_id = ? AND status = 1
     ORDER BY is_default DESC, id ASC`,
    [episodeId]
  );
}

export async function incrementMovieViewCount(movieId) {
  await query('UPDATE movies SET view_count = view_count + 1 WHERE id = ?', [movieId]);
}

export async function incrementMovieLikeCount(movieId) {
  await query('UPDATE movies SET like_count = like_count + 1 WHERE id = ?', [movieId]);
  const [row] = await query('SELECT like_count FROM movies WHERE id = ?', [movieId]);
  return row?.like_count || 0;
}

// ---------- ADMIN LIST & CRUD (UI16) ----------
export async function listMoviesAdmin({ q, genreId, categoryId, year, accessType, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const joins = [];
  const where = [];
  const params = [];

  if (q) {
    where.push('(m.name LIKE ? OR m.origin_name LIKE ? OR m.slug LIKE ? OR m.api_id LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (genreId) {
    joins.push('JOIN movie_genres mg ON mg.movie_id = m.id');
    where.push('mg.genre_id = ?');
    params.push(Number(genreId));
  }
  if (categoryId) {
    joins.push('JOIN movie_categories mcat ON mcat.movie_id = m.id');
    where.push('mcat.category_id = ?');
    params.push(Number(categoryId));
  }
  if (year && /^\d{4}$/.test(String(year))) {
    where.push('m.release_year = ?');
    params.push(Number(year));
  }
  if (accessType && ['FREE', 'PREMIUM'].includes(accessType)) {
    where.push('m.access_type = ?');
    params.push(accessType);
  }

  const joinSql = joins.join(' ');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRow] = await query(
    `SELECT COUNT(DISTINCT m.id) AS total FROM movies m ${joinSql} ${whereSql}`,
    params
  );

  const rows = await query(
    `SELECT DISTINCT ${CARD_COLUMNS}
     FROM movies m
     ${joinSql}
     ${whereSql}
     ORDER BY m.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const items = await attachGenresAndCountries(rows);
  return { items, total: countRow.total };
}

async function upsertTaxonomyByName(conn, table, name) {
  const cleanName = name.trim();
  const slug = slugify(cleanName);
  if (!slug) return null;

  const [existing] = await conn.execute(
    `SELECT id FROM ${table} WHERE slug = ? OR name = ? LIMIT 1`,
    [slug, cleanName]
  );
  if (existing.length > 0) {
    return existing[0].id;
  }

  if (table === 'countries') {
    const [ins] = await conn.execute('INSERT INTO countries (code, name, slug) VALUES (NULL, ?, ?)', [
      cleanName,
      slug,
    ]);
    return ins.insertId;
  }
  if (table === 'genres' || table === 'categories') {
    const [ins] = await conn.execute(
      `INSERT INTO ${table} (name, slug, status) VALUES (?, ?, 1)`,
      [cleanName, slug]
    );
    return ins.insertId;
  }
  // actors / directors
  const [ins] = await conn.execute(`INSERT INTO ${table} (name, slug) VALUES (?, ?)`, [
    cleanName,
    slug,
  ]);
  return ins.insertId;
}

export async function syncMovieRelations(conn, movieId, payload) {
  const relationConfigs = [
    {
      joinTable: 'movie_genres',
      fkCol: 'genre_id',
      refTable: 'genres',
      ids: payload.genre_ids,
      names: payload.genre_names,
    },
    {
      joinTable: 'movie_countries',
      fkCol: 'country_id',
      refTable: 'countries',
      ids: payload.country_ids,
      names: payload.country_names,
    },
    {
      joinTable: 'movie_categories',
      fkCol: 'category_id',
      refTable: 'categories',
      ids: payload.category_ids,
      names: payload.category_names,
    },
    {
      joinTable: 'movie_actors',
      fkCol: 'actor_id',
      refTable: 'actors',
      ids: payload.actor_ids,
      names: payload.actor_names,
    },
    {
      joinTable: 'movie_directors',
      fkCol: 'director_id',
      refTable: 'directors',
      ids: payload.director_ids,
      names: payload.director_names,
    },
  ];

  for (const cfg of relationConfigs) {
    if (cfg.ids === undefined && cfg.names === undefined) {
      continue;
    }

    const finalIds = new Set(Array.isArray(cfg.ids) ? cfg.ids : []);
    if (Array.isArray(cfg.names)) {
      for (const n of cfg.names) {
        const resolvedId = await upsertTaxonomyByName(conn, cfg.refTable, n);
        if (resolvedId) finalIds.add(resolvedId);
      }
    }

    await conn.execute(`DELETE FROM ${cfg.joinTable} WHERE movie_id = ?`, [movieId]);
    for (const refId of finalIds) {
      await conn.execute(
        `INSERT IGNORE INTO ${cfg.joinTable} (movie_id, ${cfg.fkCol}) VALUES (?, ?)`,
        [movieId, refId]
      );
    }
  }
}

export async function insertMovieRow(conn, data) {
  const [res] = await conn.execute(
    `INSERT INTO movies (
       api_id, external_source, name, origin_name, slug, description,
       poster_url, thumbnail_url, banner_url, release_year, type, access_type,
       movie_status, duration_minutes, total_episodes, current_episode_info,
       quality, language, tmdb_id, imdb_id, status, is_featured
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.api_id || null,
      data.external_source || 'MANUAL',
      data.name,
      data.origin_name || null,
      data.slug,
      data.description || null,
      data.poster_url || null,
      data.thumbnail_url || null,
      data.banner_url || null,
      data.release_year || null,
      data.type || 'SINGLE',
      data.access_type || 'FREE',
      data.movie_status || 'COMPLETED',
      data.duration_minutes || null,
      data.total_episodes || 1,
      data.current_episode_info || null,
      data.quality || 'HD',
      data.language || null,
      data.tmdb_id || null,
      data.imdb_id || null,
      data.status ?? 1,
      data.is_featured ? 1 : 0,
    ]
  );
  return res.insertId;
}

export async function updateMovieRow(conn, movieId, data) {
  await conn.execute(
    `UPDATE movies SET
       api_id = ?, external_source = ?, name = ?, origin_name = ?, slug = ?, description = ?,
       poster_url = ?, thumbnail_url = ?, banner_url = ?, release_year = ?, type = ?, access_type = ?,
       movie_status = ?, duration_minutes = ?, total_episodes = ?, current_episode_info = ?,
       quality = ?, language = ?, tmdb_id = ?, imdb_id = ?, status = ?, is_featured = ?
     WHERE id = ?`,
    [
      data.api_id || null,
      data.external_source || 'MANUAL',
      data.name,
      data.origin_name || null,
      data.slug,
      data.description || null,
      data.poster_url || null,
      data.thumbnail_url || null,
      data.banner_url || null,
      data.release_year || null,
      data.type || 'SINGLE',
      data.access_type || 'FREE',
      data.movie_status || 'COMPLETED',
      data.duration_minutes || null,
      data.total_episodes || 1,
      data.current_episode_info || null,
      data.quality || 'HD',
      data.language || null,
      data.tmdb_id || null,
      data.imdb_id || null,
      data.status ?? 1,
      data.is_featured ? 1 : 0,
      movieId,
    ]
  );
}

export async function insertEpisodesAndSources(conn, movieId, episodes) {
  for (const ep of episodes) {
    const [epRes] = await conn.execute(
      `INSERT INTO episodes (movie_id, episode_number, title, slug, duration_seconds, status)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [movieId, ep.episode_number, ep.title || null, ep.slug, ep.duration_seconds || null]
    );
    const episodeId = epRes.insertId;

    let hasDefault = ep.sources.some((s) => s.is_default);
    for (let i = 0; i < ep.sources.length; i += 1) {
      const src = ep.sources[i];
      const isDefault = hasDefault ? Boolean(src.is_default) : i === 0;
      if (isDefault) hasDefault = true;

      await conn.execute(
        `INSERT INTO video_sources (episode_id, source_name, video_url, quality, format_type, is_default, status)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          episodeId,
          src.source_name,
          src.video_url,
          src.quality || 'HD',
          src.format_type || 'EMBED',
          isDefault ? 1 : 0,
        ]
      );
    }
  }
}

export async function deleteMovieById(id) {
  const [res] = await pool.execute('DELETE FROM movies WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

export async function logAdminMovieAction(conn, adminUser, actionType, description, metadata) {
  await conn.execute(
    `INSERT INTO activity_logs (user_id, actor_label, action_type, description, status, metadata)
     VALUES (?, ?, ?, ?, 'Hoàn tất', ?)`,
    [
      adminUser.id,
      adminUser.fullName || adminUser.email,
      actionType,
      description,
      JSON.stringify(metadata || {}),
    ]
  );
}
