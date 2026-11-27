import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './favorites.repository.js';

export async function listMyFavorites(userId, queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 12, 48);
  const type = queryObj.type ? String(queryObj.type).trim().toUpperCase() : undefined;

  const [{ items, total }, counts] = await Promise.all([
    repo.listFavoritesByUser(userId, { type, limit, offset }),
    repo.getFavoriteCountsByType(userId),
  ]);

  return {
    items,
    counts,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function addFavorite(userId, movieId) {
  const movie = await repo.findMovieExists(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }
  await repo.addFavorite(userId, movieId);
  return { movie_id: movieId, is_favorited: true };
}

export async function removeFavorite(userId, movieId) {
  const deleted = await repo.removeFavorite(userId, movieId);
  if (!deleted) {
    throw new AppError(404, 'FAVORITE_NOT_FOUND', 'Phim không nằm trong danh sách yêu thích.');
  }
}

export async function clearAllFavorites(userId) {
  const deletedCount = await repo.clearAllFavorites(userId);
  return { deleted_count: deletedCount };
}
