import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './reports.repository.js';

export async function submitReport(userId, movieId, payload) {
  const movie = await repo.findMovieById(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }
  return repo.createMovieReport({
    userId,
    movieId,
    episodeId: payload.episode_id,
    videoSourceId: payload.video_source_id,
    reason: payload.reason,
    description: payload.description,
  });
}

export async function listReportsAdmin(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 20, 100);
  const status = queryObj.status ? String(queryObj.status).trim().toUpperCase() : undefined;
  const { items, total } = await repo.listReportsAdmin({ status, limit, offset });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function resolveReport(reportId) {
  const updated = await repo.resolveReport(reportId);
  if (!updated) {
    throw new AppError(404, 'REPORT_NOT_FOUND', 'Không tìm thấy báo lỗi này.');
  }
  return updated;
}
