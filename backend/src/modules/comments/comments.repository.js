import { pool, query } from '../../config/db.js';

export async function findMovieExists(movieId) {
  const rows = await query('SELECT id FROM movies WHERE id = ? AND status = 1 LIMIT 1', [movieId]);
  return rows[0] || null;
}

export async function findEpisodeInMovie(movieId, episodeId) {
  const rows = await query('SELECT id FROM episodes WHERE id = ? AND movie_id = ? LIMIT 1', [
    episodeId,
    movieId,
  ]);
  return rows[0] || null;
}

export async function findCommentById(commentId) {
  const rows = await query('SELECT * FROM comments WHERE id = ? LIMIT 1', [commentId]);
  return rows[0] || null;
}

export async function listPublicComments(movieId, { episodeId, sort, limit, offset, currentUserId }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = ['c.movie_id = ?', 'c.parent_id IS NULL', 'c.status = 1'];
  const params = [movieId];
  if (episodeId) {
    where.push('c.episode_id = ?');
    params.push(Number(episodeId));
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const orderSql = sort === 'oldest' ? 'c.created_at ASC, c.id ASC' : 'c.created_at DESC, c.id DESC';

  const [countRow] = await query(
    `SELECT COUNT(*) AS total FROM comments c ${whereSql}`,
    params
  );

  const parents = await query(
    `SELECT c.id, c.user_id, c.movie_id, c.episode_id, c.parent_id, c.content,
            c.like_count, c.is_spoil, c.created_at, c.updated_at,
            u.username, u.full_name, u.avatar,
            e.episode_number, e.title AS episode_title
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN episodes e ON e.id = c.episode_id
     ${whereSql}
     ORDER BY ${orderSql}
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  if (parents.length === 0) {
    return { items: [], total: countRow.total };
  }

  const parentIds = parents.map((p) => p.id);
  const parentPh = parentIds.map(() => '?').join(',');
  const replies = await query(
    `SELECT c.id, c.user_id, c.movie_id, c.episode_id, c.parent_id, c.content,
            c.like_count, c.is_spoil, c.created_at, c.updated_at,
            u.username, u.full_name, u.avatar
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.parent_id IN (${parentPh}) AND c.status = 1
     ORDER BY c.created_at ASC, c.id ASC`,
    parentIds
  );

  const allIds = [...parentIds, ...replies.map((r) => r.id)];
  const likedSet = new Set();
  if (currentUserId && allIds.length > 0) {
    const allPh = allIds.map(() => '?').join(',');
    const likedRows = await query(
      `SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (${allPh})`,
      [currentUserId, ...allIds]
    );
    for (const row of likedRows) likedSet.add(row.comment_id);
  }

  const replyMap = new Map();
  for (const r of replies) {
    if (!replyMap.has(r.parent_id)) replyMap.set(r.parent_id, []);
    replyMap.get(r.parent_id).push({
      ...r,
      is_spoil: Boolean(r.is_spoil),
      is_liked: likedSet.has(r.id),
    });
  }

  const items = parents.map((p) => ({
    ...p,
    is_spoil: Boolean(p.is_spoil),
    is_liked: likedSet.has(p.id),
    replies: replyMap.get(p.id) || [],
  }));

  return { items, total: countRow.total };
}

export async function createComment({ userId, movieId, episodeId, parentId, content, isSpoil }) {
  const [res] = await pool.execute(
    `INSERT INTO comments (user_id, movie_id, episode_id, parent_id, content, is_spoil, status)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [userId, movieId, episodeId || null, parentId || null, content, isSpoil ? 1 : 0]
  );

  const rows = await query(
    `SELECT c.*, u.username, u.full_name, u.avatar, e.episode_number, e.title AS episode_title
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN episodes e ON e.id = c.episode_id
     WHERE c.id = ?
     LIMIT 1`,
    [res.insertId]
  );
  return rows[0];
}

export async function toggleCommentLike(conn, commentId, userId) {
  const [existing] = await conn.execute(
    'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ? LIMIT 1',
    [commentId, userId]
  );

  let liked;
  if (existing.length > 0) {
    await conn.execute('DELETE FROM comment_likes WHERE id = ?', [existing[0].id]);
    liked = false;
  } else {
    await conn.execute('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [
      commentId,
      userId,
    ]);
    liked = true;
  }

  const [cntRow] = await conn.execute(
    'SELECT COUNT(*) AS cnt FROM comment_likes WHERE comment_id = ?',
    [commentId]
  );
  const likeCount = cntRow[0].cnt;
  await conn.execute('UPDATE comments SET like_count = ? WHERE id = ?', [likeCount, commentId]);

  return { comment_id: commentId, is_liked: liked, like_count: likeCount };
}

export async function deleteCommentById(commentId) {
  const [res] = await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
  return res.affectedRows > 0;
}

// ---------- ADMIN (UI22) ----------
export async function listCommentsAdmin({ q, score, status, limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = [];
  const params = [];

  if (q) {
    where.push('(u.full_name LIKE ? OR u.username LIKE ? OR m.name LIKE ? OR c.content LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (score && /^[1-5]$/.test(String(score))) {
    where.push('r.score = ?');
    params.push(Number(score));
  }
  if (status !== undefined && status !== '' && ['0', '1'].includes(String(status))) {
    where.push('c.status = ?');
    params.push(Number(status));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRow] = await query(
    `SELECT COUNT(*) AS total
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN movies m ON m.id = c.movie_id
     LEFT JOIN ratings r ON r.user_id = c.user_id AND r.movie_id = c.movie_id
     ${whereSql}`,
    params
  );

  const [summaryRow] = await query(
    `SELECT COUNT(*) AS total_all,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS visible_count,
            SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS hidden_count
     FROM comments`
  );

  const items = await query(
    `SELECT c.id, c.user_id, c.movie_id, c.episode_id, c.parent_id, c.content,
            c.like_count, c.status, c.hidden_reason, c.is_spoil, c.created_at, c.updated_at,
            u.username, u.full_name, u.email,
            m.name AS movie_name, m.slug AS movie_slug,
            r.score AS rating_score
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN movies m ON m.id = c.movie_id
     LEFT JOIN ratings r ON r.user_id = c.user_id AND r.movie_id = c.movie_id
     ${whereSql}
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    items: items.map((item) => ({
      ...item,
      comment_code: `CMT${String(item.id).padStart(3, '0')}`,
      is_spoil: Boolean(item.is_spoil),
    })),
    summary: {
      total: Number(summaryRow.total_all) || 0,
      visible: Number(summaryRow.visible_count) || 0,
      hidden: Number(summaryRow.hidden_count) || 0,
    },
    total: countRow.total,
  };
}

export async function updateCommentStatus(commentId, { status, hiddenReason }) {
  await query('UPDATE comments SET status = ?, hidden_reason = ? WHERE id = ?', [
    status,
    status === 0 ? hiddenReason || 'Bình luận vi phạm quy định cộng đồng.' : null,
    commentId,
  ]);
  return findCommentById(commentId);
}
