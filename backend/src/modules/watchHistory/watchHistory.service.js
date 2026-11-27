import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import * as repo from './watchHistory.repository.js';

const COMPLETION_THRESHOLD_PERCENT = 95;

function formatTimeDisplay(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function enrichProgressItem(row) {
  if (!row) return null;
  const remainingSeconds = Math.max(0, (row.duration_seconds || 0) - (row.stopped_at_seconds || 0));
  const shouldPromptResume =
    row.watch_status === 'WATCHING' &&
    row.stopped_at_seconds > 0 &&
    row.duration_seconds > 0;

  return {
    ...row,
    stopped_at_formatted: formatTimeDisplay(row.stopped_at_seconds),
    duration_formatted: formatTimeDisplay(row.duration_seconds),
    remaining_seconds: remainingSeconds,
    should_prompt_resume: shouldPromptResume,
  };
}

export async function getMyWatchHistory(userId, queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 12, 50);
  const { items, total } = await repo.listWatchHistoriesByUser(userId, { limit, offset });

  return {
    items: items.map(enrichProgressItem),
    meta: buildPaginationMeta(page, limit, total),
  };
}

export async function getEpisodeProgress(userId, episodeId) {
  const row = await repo.findUserEpisodeProgress(userId, episodeId);
  if (!row) {
    return {
      has_progress: false,
      should_prompt_resume: false,
      progress: null,
    };
  }

  const enriched = enrichProgressItem(row);
  return {
    has_progress: true,
    should_prompt_resume: enriched.should_prompt_resume,
    progress: enriched,
  };
}

export async function saveWatchProgress(userId, payload) {
  const episode = await repo.findEpisodeOwnership(payload.movie_id, payload.episode_id);
  if (!episode) {
    throw new AppError(404, 'EPISODE_NOT_FOUND', 'Tập phim không tồn tại hoặc không thuộc bộ phim này.');
  }

  const durationSeconds = Math.max(1, Math.round(payload.duration_seconds));
  let stoppedAtSeconds = payload.restart_from_zero
    ? 0
    : Math.min(durationSeconds, Math.max(0, Math.round(payload.stopped_at_seconds)));

  let progressPercent = Number(((stoppedAtSeconds / durationSeconds) * 100).toFixed(2));
  progressPercent = Math.min(100, Math.max(0, progressPercent));

  let watchStatus = 'WATCHING';
  let completedAt = null;

  if (!payload.restart_from_zero && (payload.is_ended || progressPercent >= COMPLETION_THRESHOLD_PERCENT)) {
    watchStatus = 'COMPLETED';
    completedAt = new Date();
    if (payload.is_ended) {
      stoppedAtSeconds = durationSeconds;
      progressPercent = 100.0;
    }
  }

  const saved = await repo.upsertWatchProgress({
    userId,
    movieId: payload.movie_id,
    episodeId: payload.episode_id,
    stoppedAtSeconds,
    durationSeconds,
    progressPercent,
    watchStatus,
    completedAt,
  });

  return enrichProgressItem(saved);
}

export async function removeWatchHistoryItem(userId, id) {
  const deleted = await repo.deleteWatchHistoryById(userId, id);
  if (!deleted) {
    throw new AppError(404, 'HISTORY_NOT_FOUND', 'Không tìm thấy mục lịch sử xem này.');
  }
}

export async function clearMyWatchHistory(userId) {
  const deletedCount = await repo.clearAllWatchHistories(userId);
  return { deleted_count: deletedCount };
}
