import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { slugify } from '../../utils/slugify.js';
import * as moviesRepo from './movies.repository.js';
import { fetchNguonCPreview, fetchPreviewByUrl, searchNguonC } from './nguonc.service.js';

function resolveMovieSlug(name, providedSlug) {
  const slug = providedSlug && providedSlug.trim() ? providedSlug.trim() : slugify(name);
  if (!slug) {
    throw new AppError(400, 'INVALID_SLUG', 'Không thể tạo slug hợp lệ từ tên phim.');
  }
  return slug;
}

// ---------- PUBLIC ----------
export async function getHomePageData() {
  return moviesRepo.getHomeSections();
}

export async function searchPublicMovies(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 12, 48);
  const { items, total } = await moviesRepo.searchPublicMovies({
    q: String(queryObj.q || '').trim(),
    genre: queryObj.genre ? String(queryObj.genre).trim() : undefined,
    country: queryObj.country ? String(queryObj.country).trim() : undefined,
    category: queryObj.category ? String(queryObj.category).trim() : undefined,
    year: queryObj.year ? String(queryObj.year).trim() : undefined,
    movie_status: queryObj.movie_status ? String(queryObj.movie_status).trim().toUpperCase() : undefined,
    type: queryObj.type ? String(queryObj.type).trim().toUpperCase() : undefined,
    access_type: queryObj.access_type ? String(queryObj.access_type).trim().toUpperCase() : undefined,
    sort: queryObj.sort ? String(queryObj.sort).trim() : 'newest',
    limit,
    offset,
  });

  return {
    items,
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getMovieDetailBySlug(slug, currentUser = null) {
  const movie = await moviesRepo.findMovieBySlug(slug);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }

  const relations = await moviesRepo.findMovieFullRelations(movie.id);
  const interaction = currentUser
    ? await moviesRepo.findUserMovieInteraction(currentUser.id, movie.id)
    : { is_favorited: false, user_rating: null };

  const canWatch =
    movie.access_type === 'FREE' ||
    Boolean(currentUser && (currentUser.role === 'ADMIN' || currentUser.isPremium));

  return {
    ...movie,
    is_featured: Boolean(movie.is_featured),
    can_watch: canWatch,
    ...relations,
    ...interaction,
  };
}

export async function getEpisodeWatchData(slug, episodeSlug, currentUser = null) {
  const movie = await moviesRepo.findMovieBySlug(slug);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }

  // Strict Backend RBAC/Premium check BEFORE querying any video_sources / video_url
  if (movie.access_type === 'PREMIUM') {
    if (!currentUser) {
      throw new AppError(
        403,
        'PREMIUM_REQUIRED',
        'Phim này yêu cầu tài khoản Premium. Vui lòng đăng nhập và nâng cấp gói Premium để xem.'
      );
    }
    if (currentUser.role !== 'ADMIN' && !currentUser.isPremium) {
      throw new AppError(
        403,
        'PREMIUM_REQUIRED',
        'Tài khoản của bạn chưa có gói Premium còn hiệu lực. Vui lòng nâng cấp để xem bộ phim này.'
      );
    }
  }

  const episode = await moviesRepo.findEpisodeForWatch(movie.id, episodeSlug);
  if (!episode) {
    throw new AppError(404, 'EPISODE_NOT_FOUND', 'Không tìm thấy tập phim yêu cầu.');
  }

  const [sources, relations] = await Promise.all([
    moviesRepo.findActiveVideoSources(episode.id),
    moviesRepo.findMovieFullRelations(movie.id),
  ]);

  await moviesRepo.incrementMovieViewCount(movie.id);

  const currentIdx = relations.episodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIdx > 0 ? relations.episodes[currentIdx - 1] : null;
  const nextEpisode =
    currentIdx >= 0 && currentIdx < relations.episodes.length - 1
      ? relations.episodes[currentIdx + 1]
      : null;

  return {
    movie: {
      id: movie.id,
      name: movie.name,
      origin_name: movie.origin_name,
      slug: movie.slug,
      type: movie.type,
      access_type: movie.access_type,
      quality: movie.quality,
      language: movie.language,
      total_episodes: movie.total_episodes,
      like_count: movie.like_count,
      view_count: movie.view_count + 1,
    },
    current_episode: {
      ...episode,
      sources: sources.map((s) => ({
        ...s,
        is_default: Boolean(s.is_default),
      })),
    },
    prev_episode: prevEpisode,
    next_episode: nextEpisode,
    episodes: relations.episodes,
  };
}

export async function likeMovie(movieId) {
  const movie = await moviesRepo.findMovieById(movieId);
  if (!movie || movie.status !== 1) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim này.');
  }
  const likeCount = await moviesRepo.incrementMovieLikeCount(movieId);
  return { movie_id: movieId, like_count: likeCount };
}

// ---------- ADMIN (UI16) ----------
export async function listMoviesAdmin(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 10, 100);
  const { items, total } = await moviesRepo.listMoviesAdmin({
    q: String(queryObj.q || '').trim(),
    genreId: queryObj.genre_id,
    categoryId: queryObj.category_id,
    year: queryObj.year,
    accessType: queryObj.access_type ? String(queryObj.access_type).toUpperCase() : undefined,
    limit,
    offset,
  });

  return {
    items: items.map((m) => ({
      ...m,
      movie_code: `MOV${String(m.id).padStart(3, '0')}`,
    })),
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getMovieAdminById(id) {
  const movie = await moviesRepo.findMovieById(id);
  if (!movie) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim.');
  }
  const relations = await moviesRepo.findMovieFullRelations(movie.id, { includeHiddenEpisodes: true });
  return {
    ...movie,
    movie_code: `MOV${String(movie.id).padStart(3, '0')}`,
    is_featured: Boolean(movie.is_featured),
    ...relations,
  };
}

export async function createManualMovie(payload, adminUser) {
  const slug = resolveMovieSlug(payload.name, payload.slug);
  const movieId = await withTransaction(async (conn) => {
    const newId = await moviesRepo.insertMovieRow(conn, { ...payload, slug, external_source: 'MANUAL' });
    await moviesRepo.syncMovieRelations(conn, newId, payload);
    await moviesRepo.logAdminMovieAction(
      conn,
      adminUser,
      'MOVIE_CREATE_MANUAL',
      `Admin thêm phim thủ công: "${payload.name}"`,
      { movieId: newId, slug }
    );
    return newId;
  });

  return getMovieAdminById(movieId);
}

export async function updateMovieAdmin(id, payload, adminUser) {
  const existing = await moviesRepo.findMovieById(id);
  if (!existing) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim.');
  }

  const slug = resolveMovieSlug(payload.name, payload.slug || existing.slug);

  await withTransaction(async (conn) => {
    await moviesRepo.updateMovieRow(conn, id, {
      ...payload,
      external_source: payload.external_source || existing.external_source,
      slug,
    });
    await moviesRepo.syncMovieRelations(conn, id, payload);
    await moviesRepo.logAdminMovieAction(
      conn,
      adminUser,
      'MOVIE_UPDATE',
      `Admin cập nhật phim: "${payload.name}"`,
      { movieId: id, slug }
    );
  });

  return getMovieAdminById(id);
}

export async function deleteMovieAdmin(id) {
  const deleted = await moviesRepo.deleteMovieById(id);
  if (!deleted) {
    throw new AppError(404, 'MOVIE_NOT_FOUND', 'Không tìm thấy bộ phim.');
  }
}

// ---------- MULTI-PROVIDER API PREVIEW & IMPORT (UI16) ----------
export async function searchNguonCMovies(keyword, page, provider) {
  return searchNguonC(keyword, page, provider);
}

export async function previewNguonCMovie(slugOrId, provider) {
  const preview = await fetchNguonCPreview(slugOrId, provider);
  const existingBySlug = await moviesRepo.findMovieBySlug(preview.slug, { includeHidden: true });
  return {
    ...preview,
    already_exists_in_db: Boolean(existingBySlug),
    existing_movie_id: existingBySlug?.id || null,
  };
}

export async function previewMovieByUrl(rawUrl, provider) {
  const preview = await fetchPreviewByUrl(rawUrl, provider);
  const existingBySlug = await moviesRepo.findMovieBySlug(preview.slug, { includeHidden: true });
  return {
    ...preview,
    already_exists_in_db: Boolean(existingBySlug),
    existing_movie_id: existingBySlug?.id || null,
  };
}

export async function importNguonCMovie(payload, adminUser) {
  const slug = resolveMovieSlug(payload.name, payload.slug);
  const providerSource = payload.external_source || 'NGUONC';
  const movieId = await withTransaction(async (conn) => {
    const newId = await moviesRepo.insertMovieRow(conn, {
      ...payload,
      external_source: providerSource,
      slug,
    });
    await moviesRepo.syncMovieRelations(conn, newId, payload);
    if (Array.isArray(payload.episodes) && payload.episodes.length > 0) {
      await moviesRepo.insertEpisodesAndSources(conn, newId, payload.episodes);
    }
    await moviesRepo.logAdminMovieAction(
      conn,
      adminUser,
      `MOVIE_IMPORT_${providerSource}`,
      `Admin nhập phim từ ${providerSource}: "${payload.name}"`,
      {
        movieId: newId,
        provider: providerSource,
        apiId: payload.api_id || null,
        episodesCount: payload.episodes?.length || 0,
      }
    );
    return newId;
  });

  return getMovieAdminById(movieId);
}
