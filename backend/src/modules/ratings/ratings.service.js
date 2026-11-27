import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './ratings.repository.js';

export async function getMovieRatings(movieId, queryObj) {
  const movie = await repo.findMovieForRating(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }

  const { page, limit, offset } = parsePagination(queryObj, 10, 50);
  const [summary, { items, total }] = await Promise.all([
    repo.getRatingSummary(movieId),
    repo.listRatingsByMovie(movieId, { limit, offset }),
  ]);

  return {
    summary,
    items,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function upsertMyRating(userId, movieId, { score, review }) {
  const movie = await repo.findMovieForRating(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }

  return withTransaction((conn) =>
    repo.upsertRatingAndSyncMovie(conn, { userId, movieId, score, review })
  );
}
