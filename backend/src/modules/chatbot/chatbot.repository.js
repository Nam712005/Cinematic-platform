import { pool, query } from '../../config/db.js';

export async function getChatbotRawSettings() {
  const rows = await query(
    `SELECT setting_key, setting_value, value_type, is_encrypted
     FROM system_settings
     WHERE setting_group = 'CHATBOT'`
  );
  const map = {};
  for (const r of rows) {
    map[r.setting_key] = r;
  }
  return map;
}

export async function upsertChatbotSetting(conn, { key, value, valueType = 'STRING', isEncrypted = 0, updatedBy }) {
  await conn.execute(
    `INSERT INTO system_settings (setting_group, setting_key, setting_value, value_type, is_encrypted, updated_by)
     VALUES ('CHATBOT', ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       value_type = VALUES(value_type),
       is_encrypted = VALUES(is_encrypted),
       updated_by = VALUES(updated_by),
       updated_at = NOW()`,
    [key, value, valueType, isEncrypted, updatedBy]
  );
}

// ---------- MEMBER SESSIONS & MESSAGES ----------
export async function listSessionsByUser(userId) {
  return query(
    `SELECT id, user_id, session_title, provider_used, model_used, total_messages, status, created_at, updated_at
     FROM chat_sessions
     WHERE user_id = ? AND status = 1
     ORDER BY COALESCE(updated_at, created_at) DESC, id DESC`,
    [userId]
  );
}

export async function findSessionById(sessionId) {
  const rows = await query('SELECT * FROM chat_sessions WHERE id = ? LIMIT 1', [sessionId]);
  return rows[0] || null;
}

export async function createSession(userId, { title, provider, model }) {
  const [res] = await pool.execute(
    `INSERT INTO chat_sessions (user_id, session_title, provider_used, model_used, total_messages, status)
     VALUES (?, ?, ?, ?, 0, 1)`,
    [userId, title || 'Cuộc trò chuyện mới', provider || null, model || null]
  );
  return findSessionById(res.insertId);
}

export async function deleteSessionById(sessionId) {
  const [res] = await pool.execute('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);
  return res.affectedRows > 0;
}

export async function listMessagesBySession(sessionId) {
  return query(
    `SELECT id, session_id, sender_type, message_text, provider, model_name,
            input_tokens, output_tokens, tokens_used, latency_ms, message_status, created_at
     FROM chat_messages
     WHERE session_id = ?
     ORDER BY created_at ASC, id ASC`,
    [sessionId]
  );
}

export async function getRecentMessagesForContext(sessionId, limit = 10) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const rows = await query(
    `SELECT sender_type, message_text
     FROM chat_messages
     WHERE session_id = ? AND message_status = 'SUCCESS'
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    [sessionId]
  );
  return rows.reverse();
}

export async function insertMessage({
  sessionId,
  senderType,
  messageText,
  provider = null,
  modelName = null,
  inputTokens = 0,
  outputTokens = 0,
  tokensUsed = 0,
  latencyMs = 0,
  messageStatus = 'SUCCESS',
}) {
  const [res] = await pool.execute(
    `INSERT INTO chat_messages (
       session_id, sender_type, message_text, provider, model_name,
       input_tokens, output_tokens, tokens_used, latency_ms, message_status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      senderType,
      messageText,
      provider,
      modelName,
      inputTokens,
      outputTokens,
      tokensUsed,
      latencyMs,
      messageStatus,
    ]
  );

  const rows = await query(
    `SELECT id, session_id, sender_type, message_text, provider, model_name,
            input_tokens, output_tokens, tokens_used, latency_ms, message_status, created_at
     FROM chat_messages WHERE id = ? LIMIT 1`,
    [res.insertId]
  );
  return rows[0];
}

export async function updateSessionMeta(sessionId, { title, provider, model }) {
  if (title) {
    await query(
      `UPDATE chat_sessions
       SET session_title = ?,
           provider_used = COALESCE(?, provider_used),
           model_used = COALESCE(?, model_used),
           total_messages = (SELECT COUNT(*) FROM chat_messages WHERE session_id = ?),
           updated_at = NOW()
       WHERE id = ?`,
      [title, provider || null, model || null, sessionId, sessionId]
    );
  } else {
    await query(
      `UPDATE chat_sessions
       SET provider_used = COALESCE(?, provider_used),
           model_used = COALESCE(?, model_used),
           total_messages = (SELECT COUNT(*) FROM chat_messages WHERE session_id = ?),
           updated_at = NOW()
       WHERE id = ?`,
      [provider || null, model || null, sessionId, sessionId]
    );
  }
}

// ---------- ADMIN STATS (UI23) ----------
export async function getChatbotUsageStats() {
  const [sessionStats] = await query(
    `SELECT COUNT(*) AS total_sessions,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS sessions_last_24h
     FROM chat_sessions`
  );

  const [msgStats] = await query(
    `SELECT COUNT(*) AS total_api_calls,
            SUM(CASE WHEN message_status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_calls,
            COALESCE(SUM(input_tokens), 0) AS total_input_tokens,
            COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
            COALESCE(SUM(tokens_used), 0) AS total_tokens,
            COALESCE(ROUND(AVG(CASE WHEN latency_ms > 0 THEN latency_ms END)), 0) AS avg_latency_ms
     FROM chat_messages
     WHERE sender_type = 'BOT'`
  );

  const totalCalls = Number(msgStats.total_api_calls) || 0;
  const successCalls = Number(msgStats.success_calls) || 0;
  const inputTokens = Number(msgStats.total_input_tokens) || 0;
  const outputTokens = Number(msgStats.total_output_tokens) || 0;
  const totalTokens = Number(msgStats.total_tokens) || inputTokens + outputTokens;

  // Approximate blended cost estimate (e.g., gpt-4o-mini / gemini-2.0-flash tier: ~$0.15/1M in, ~$0.60/1M out)
  const estimatedCostUsd = Number(
    ((inputTokens / 1_000_000) * 0.15 + (outputTokens / 1_000_000) * 0.6).toFixed(4)
  );

  return {
    total_sessions: Number(sessionStats.total_sessions) || 0,
    sessions_last_24h: Number(sessionStats.sessions_last_24h) || 0,
    total_api_calls: totalCalls,
    success_rate: totalCalls > 0 ? Number(((successCalls / totalCalls) * 100).toFixed(1)) : 100,
    total_input_tokens: inputTokens,
    total_output_tokens: outputTokens,
    total_tokens: totalTokens,
    avg_latency_ms: Number(msgStats.avg_latency_ms) || 0,
    estimated_cost_usd: estimatedCostUsd,
  };
}

// ---------- REAL MYSQL RAG QUERIES FOR CHATBOT CONTEXT ----------
const MOVIE_RAG_SELECT = `
  SELECT m.id, m.name, m.origin_name, m.slug, m.release_year, m.type,
         m.access_type, m.quality, m.rating_avg, m.view_count,
         m.current_episode_info, m.description, m.is_featured,
         m.poster_url, m.thumbnail_url,
         GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres,
         GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ') AS directors,
         GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') AS actors
  FROM movies m
  LEFT JOIN movie_genres mg ON mg.movie_id = m.id
  LEFT JOIN genres g ON g.id = mg.genre_id
  LEFT JOIN movie_directors md ON md.movie_id = m.id
  LEFT JOIN directors d ON d.id = md.director_id
  LEFT JOIN movie_actors ma ON ma.movie_id = m.id
  LEFT JOIN actors a ON a.id = ma.actor_id
`;

export async function findMovieBySlugForRag(slug) {
  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) return null;
  const rows = await query(
    `${MOVIE_RAG_SELECT}
     WHERE m.status = 1 AND m.slug = ?
     GROUP BY m.id
     LIMIT 1`,
    [cleanSlug]
  );
  return rows[0] || null;
}

export async function findSimilarMoviesByMovieIdForRag(movieId, limit = 6) {
  const safeId = Number.parseInt(movieId, 10);
  if (!Number.isInteger(safeId) || safeId <= 0) return [];
  const safeLimit = Math.max(1, Math.min(8, Number.parseInt(limit, 10) || 6));

  return query(
    `SELECT m.id, m.name, m.origin_name, m.slug, m.release_year, m.type,
            m.access_type, m.quality, m.rating_avg, m.view_count,
            m.current_episode_info, m.description, m.is_featured,
            m.poster_url, m.thumbnail_url,
            COUNT(DISTINCT mg_shared.genre_id) AS shared_genres_count,
            (SELECT GROUP_CONCAT(DISTINCT g_all.name ORDER BY g_all.name SEPARATOR ', ')
             FROM movie_genres mg_all
             JOIN genres g_all ON g_all.id = mg_all.genre_id
             WHERE mg_all.movie_id = m.id) AS genres,
            (SELECT GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ')
             FROM movie_directors md
             JOIN directors d ON d.id = md.director_id
             WHERE md.movie_id = m.id) AS directors,
            (SELECT GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ')
             FROM movie_actors ma
             JOIN actors a ON a.id = ma.actor_id
             WHERE ma.movie_id = m.id) AS actors
     FROM movies m
     JOIN movie_genres mg_shared ON mg_shared.movie_id = m.id
     WHERE m.status = 1
       AND m.id <> ?
       AND mg_shared.genre_id IN (SELECT genre_id FROM movie_genres WHERE movie_id = ?)
     GROUP BY m.id
     ORDER BY shared_genres_count DESC, m.release_year DESC, m.is_featured DESC, m.rating_avg DESC, m.created_at DESC
     LIMIT ${safeLimit}`,
    [safeId, safeId]
  );
}

export async function listActiveGenresForRag() {
  return query('SELECT id, name, slug FROM genres WHERE status = 1 ORDER BY name ASC');
}

export async function findMoviesByGenresForRag(genreNames = [], limit = 8) {
  if (!Array.isArray(genreNames) || genreNames.length === 0) return [];
  const safeLimit = Math.max(1, Math.min(10, Number.parseInt(limit, 10) || 8));
  const placeholders = genreNames.map(() => '?').join(', ');

  return query(
    `${MOVIE_RAG_SELECT}
     WHERE m.status = 1
       AND EXISTS (
         SELECT 1 FROM movie_genres mg2
         JOIN genres g2 ON g2.id = mg2.genre_id
         WHERE mg2.movie_id = m.id AND g2.name IN (${placeholders})
       )
     GROUP BY m.id
     ORDER BY m.is_featured DESC, m.rating_avg DESC, m.view_count DESC, m.created_at DESC
     LIMIT ${safeLimit}`,
    genreNames
  );
}

export async function searchMoviesByKeywordsForRag(terms = [], limit = 8) {
  const cleanTerms = (terms || []).map((t) => String(t || '').trim()).filter((t) => t.length >= 2);
  if (cleanTerms.length === 0) return [];
  const safeLimit = Math.max(1, Math.min(10, Number.parseInt(limit, 10) || 8));

  const orClauses = [];
  const params = [];

  for (const term of cleanTerms.slice(0, 6)) {
    const like = `%${term}%`;
    orClauses.push(
      `(m.name LIKE ? OR m.origin_name LIKE ? OR m.slug LIKE ?
        OR EXISTS (SELECT 1 FROM movie_genres mg2 JOIN genres g2 ON g2.id = mg2.genre_id WHERE mg2.movie_id = m.id AND g2.name LIKE ?)
        OR EXISTS (SELECT 1 FROM movie_actors ma2 JOIN actors a2 ON a2.id = ma2.actor_id WHERE ma2.movie_id = m.id AND a2.name LIKE ?)
        OR EXISTS (SELECT 1 FROM movie_directors md2 JOIN directors d2 ON d2.id = md2.director_id WHERE md2.movie_id = m.id AND d2.name LIKE ?))`
    );
    params.push(like, like, like, like, like, like);
  }

  return query(
    `${MOVIE_RAG_SELECT}
     WHERE m.status = 1 AND (${orClauses.join(' OR ')})
     GROUP BY m.id
     ORDER BY m.is_featured DESC, m.rating_avg DESC, m.view_count DESC, m.created_at DESC
     LIMIT ${safeLimit}`,
    params
  );
}

export async function findFallbackFeaturedMoviesForRag(limit = 6) {
  const safeLimit = Math.max(1, Math.min(10, Number.parseInt(limit, 10) || 6));
  return query(
    `${MOVIE_RAG_SELECT}
     WHERE m.status = 1
     GROUP BY m.id
     ORDER BY m.is_featured DESC, m.created_at DESC, m.view_count DESC
     LIMIT ${safeLimit}`
  );
}

export async function listActivePremiumPlansForRag() {
  return query(
    `SELECT code, name, duration_days, price, original_price, is_popular, description, features
     FROM premium_plans
     WHERE status = 1
     ORDER BY duration_days ASC, id ASC`
  );
}
