import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './comments.repository.js';

export async function listMovieComments(movieId, queryObj, currentUser) {
  const movie = await repo.findMovieExists(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }

  const { page, limit, offset } = parsePagination(queryObj, 10, 50);
  const { items, total } = await repo.listPublicComments(movieId, {
    episodeId: queryObj.episode_id ? Number(queryObj.episode_id) : undefined,
    sort: queryObj.sort === 'oldest' ? 'oldest' : 'newest',
    limit,
    offset,
    currentUserId: currentUser?.id || null,
  });

  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function createMovieComment(userId, movieId, payload) {
  const movie = await repo.findMovieExists(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }

  if (payload.episode_id) {
    const ep = await repo.findEpisodeInMovie(movieId, payload.episode_id);
    if (!ep) {
      throw new AppError(400, 'INVALID_EPISODE', 'Tập phim không thuộc bộ phim này.');
    }
  }

  if (payload.parent_id) {
    const parent = await repo.findCommentById(payload.parent_id);
    if (!parent || parent.movie_id !== movieId || parent.status !== 1) {
      throw new AppError(400, 'INVALID_PARENT_COMMENT', 'Bình luận gốc không hợp lệ.');
    }
  }

  const created = await repo.createComment({
    userId,
    movieId,
    episodeId: payload.episode_id,
    parentId: payload.parent_id,
    content: payload.content,
    isSpoil: payload.is_spoil,
  });

  return {
    ...created,
    is_spoil: Boolean(created.is_spoil),
    is_liked: false,
    replies: [],
  };
}

export async function toggleLike(commentId, userId) {
  const comment = await repo.findCommentById(commentId);
  if (!comment || comment.status !== 1) {
    throw new AppError(404, 'COMMENT_NOT_FOUND', 'Không tìm thấy bình luận.');
  }
  return withTransaction((conn) => repo.toggleCommentLike(conn, commentId, userId));
}

export async function deleteComment(commentId, currentUser) {
  const comment = await repo.findCommentById(commentId);
  if (!comment) {
    throw new AppError(404, 'COMMENT_NOT_FOUND', 'Không tìm thấy bình luận.');
  }
  if (currentUser.role !== 'ADMIN' && comment.user_id !== currentUser.id) {
    throw new AppError(403, 'FORBIDDEN', 'Bạn chỉ có thể xóa bình luận của chính mình.');
  }
  await repo.deleteCommentById(commentId);
}

// ---------- ADMIN (UI22) ----------
export async function listCommentsAdmin(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 10, 100);
  const { items, summary, total } = await repo.listCommentsAdmin({
    q: String(queryObj.q || '').trim(),
    score: queryObj.score,
    status: queryObj.status,
    limit,
    offset,
  });

  return {
    items,
    summary,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function moderateComment(commentId, { status, hidden_reason }) {
  const comment = await repo.findCommentById(commentId);
  if (!comment) {
    throw new AppError(404, 'COMMENT_NOT_FOUND', 'Không tìm thấy bình luận.');
  }
  return repo.updateCommentStatus(commentId, { status, hiddenReason: hidden_reason });
}
