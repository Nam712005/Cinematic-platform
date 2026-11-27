import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { slugify } from '../../utils/slugify.js';
import * as repo from './episodes.repository.js';

function formatEpisode(ep) {
  return {
    ...ep,
    episode_code: `EPI${String(ep.id).padStart(3, '0')}`,
  };
}

function formatSource(src) {
  return {
    ...src,
    source_code: `SRC${String(src.id).padStart(3, '0')}`,
    is_default: Boolean(src.is_default),
  };
}

export async function listEpisodesByMovie(movieId, queryObj) {
  const movie = await repo.findMovieSummary(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim.');
  }
  const { page, limit, offset } = parsePagination(queryObj, 20, 100);
  const { items, total } = await repo.listEpisodesByMovie(movieId, { limit, offset });

  return {
    movie: { ...movie, movie_code: `MOV${String(movie.id).padStart(3, '0')}` },
    items: items.map(formatEpisode),
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function createEpisode(movieId, payload) {
  const movie = await repo.findMovieSummary(movieId);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim.');
  }

  const slug =
    payload.slug && payload.slug.trim()
      ? payload.slug.trim()
      : slugify(`tap-${payload.episode_number}`);

  const created = await repo.createEpisode(movieId, { ...payload, slug });
  return formatEpisode(created);
}

export async function updateEpisode(id, payload) {
  const existing = await repo.findEpisodeById(id);
  if (!existing) {
    throw new AppError(404, 'EPISODE_NOT_FOUND', 'Không tìm thấy tập phim.');
  }

  const slug =
    payload.slug && payload.slug.trim()
      ? payload.slug.trim()
      : existing.slug || slugify(`tap-${payload.episode_number}`);

  const updated = await repo.updateEpisode(id, { ...payload, slug });
  return formatEpisode(updated);
}

export async function deleteEpisode(id) {
  const deleted = await repo.deleteEpisode(id);
  if (!deleted) {
    throw new AppError(404, 'EPISODE_NOT_FOUND', 'Không tìm thấy tập phim.');
  }
}

// ---------- VIDEO SOURCES ----------
export async function listSourcesByEpisode(episodeId) {
  const episode = await repo.findEpisodeById(episodeId);
  if (!episode) {
    throw new AppError(404, 'EPISODE_NOT_FOUND', 'Không tìm thấy tập phim.');
  }

  const items = await repo.listSourcesByEpisode(episodeId);
  return {
    episode: formatEpisode(episode),
    items: items.map(formatSource),
  };
}

export async function createSource(episodeId, payload) {
  const episode = await repo.findEpisodeById(episodeId);
  if (!episode) {
    throw new AppError(404, 'EPISODE_NOT_FOUND', 'Không tìm thấy tập phim.');
  }

  const existingSources = await repo.listSourcesByEpisode(episodeId);
  const effectiveDefault = existingSources.length === 0 ? true : Boolean(payload.is_default);

  const newId = await withTransaction((conn) =>
    repo.createSource(conn, episodeId, { ...payload, is_default: effectiveDefault })
  );
  const created = await repo.findSourceById(newId);
  return formatSource(created);
}

export async function updateSource(sourceId, payload) {
  const existing = await repo.findSourceById(sourceId);
  if (!existing) {
    throw new AppError(404, 'SOURCE_NOT_FOUND', 'Không tìm thấy nguồn phát.');
  }

  await withTransaction((conn) => repo.updateSource(conn, sourceId, existing.episode_id, payload));
  const updated = await repo.findSourceById(sourceId);
  return formatSource(updated);
}

export async function deleteSource(sourceId) {
  const deleted = await repo.deleteSource(sourceId);
  if (!deleted) {
    throw new AppError(404, 'SOURCE_NOT_FOUND', 'Không tìm thấy nguồn phát.');
  }
}
