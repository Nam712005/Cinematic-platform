import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  Film,
  Flag,
  Info,
  Loader2,
  LogIn,
  Send,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { interactionsApi } from '../../api/interactionsApi.js';
import { moviesApi } from '../../api/moviesApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import CommentsSection from '../../components/movie/CommentsSection.jsx';
import EpisodeGrid from '../../components/player/EpisodeGrid.jsx';
import ResumeWatchModal from '../../components/player/ResumeWatchModal.jsx';
import ServerSelector from '../../components/player/ServerSelector.jsx';
import VideoPlayer from '../../components/player/VideoPlayer.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

const REPORT_REASONS = [
  'Video không phát được / Link hỏng',
  'Video bị giật lag, tải chậm',
  'Mất âm thanh hoặc lệch tiếng',
  'Lỗi phụ đề / Thuyết minh',
  'Sai nội dung tập phim',
  'Lý do khác',
];

export default function WatchPage() {
  const { slug, episodeSlug } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [watchData, setWatchData] = useState(null);
  const [activeSource, setActiveSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [premiumBlocked, setPremiumBlocked] = useState(null);
  const [notFoundMsg, setNotFoundMsg] = useState('');

  // Resume Watch Modal state
  const [resumePromptData, setResumePromptData] = useState(null);
  const [seekCommand, setSeekCommand] = useState(null);
  const lastSnapshotRef = useRef(null);

  // Episode vs All Comments filter
  const [episodeOnlyComments, setEpisodeOnlyComments] = useState(true);

  // Report Error Modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Resolve episodeSlug if user entered /watch/:slug directly
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setPremiumBlocked(null);
      setNotFoundMsg('');
      setWatchData(null);
      setActiveSource(null);
      setResumePromptData(null);
      setSeekCommand(null);
      lastSnapshotRef.current = null;

      try {
        let targetEpSlug = episodeSlug;
        if (!targetEpSlug) {
          const detailRes = await moviesApi.getMovieDetail(slug);
          const eps = detailRes?.data?.episodes || [];
          if (eps.length === 0) {
            if (active) {
              setNotFoundMsg('Bộ phim này hiện chưa có tập phim nào để phát.');
              setLoading(false);
            }
            return;
          }
          targetEpSlug = eps[0].slug;
          if (active) {
            navigate(`/watch/${slug}/${targetEpSlug}`, { replace: true });
          }
          return;
        }

        const res = await moviesApi.watchEpisode(slug, targetEpSlug);
        if (!active) return;

        const data = res?.data;
        setWatchData(data);

        const sources = data?.current_episode?.sources || [];
        const defaultSrc = sources.find((s) => s.is_default) || sources[0] || null;
        setActiveSource(defaultSrc);
      } catch (err) {
        if (!active) return;
        const status = err?.response?.status;
        const code = err?.response?.data?.errorCode;

        if (status === 403 && code === 'PREMIUM_REQUIRED') {
          setPremiumBlocked({
            message:
              err.response?.data?.message ||
              'Bộ phim này dành riêng cho thành viên Premium. Hãy nâng cấp để xem không giới hạn!',
          });
        } else if (status === 404) {
          setNotFoundMsg(getApiErrorMessage(err, 'Không tìm thấy bộ phim hoặc tập phim này.'));
        } else {
          toast.error(getApiErrorMessage(err, 'Không thể tải dữ liệu phát phim.'));
          setNotFoundMsg('Đã xảy ra lỗi khi tải trình phát phim.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      active = false;
    };
  }, [slug, episodeSlug, navigate, toast]);

  const isControllableSource =
    activeSource && String(activeSource.format_type || '').toUpperCase() !== 'EMBED';

  // Record opened movie/episode into Watch History + check ResumeWatchModal for controllable sources
  useEffect(() => {
    const movieId = watchData?.movie?.id;
    const ep = watchData?.current_episode;
    if (!isAuthenticated || !movieId || !ep?.id) {
      setResumePromptData(null);
      return undefined;
    }

    let active = true;
    interactionsApi
      .getEpisodeProgress(ep.id)
      .then(async (res) => {
        if (!active) return;
        const data = res?.data;

        if (isControllableSource && data?.should_prompt_resume && data?.progress) {
          setResumePromptData(data.progress);
          return;
        }

        // Record/refresh watch history entry whenever user opens a movie/episode
        const fallbackDuration = Math.max(60, Number(ep.duration_seconds) || 3600);
        if (!data?.has_progress) {
          await interactionsApi
            .saveWatchProgress({
              movie_id: movieId,
              episode_id: ep.id,
              stopped_at_seconds: 0,
              duration_seconds: fallbackDuration,
              is_ended: false,
            })
            .catch(() => {});
        } else if (!isControllableSource && data.progress) {
          // Touch last_watched_at for EMBED without wiping any previously saved seconds
          await interactionsApi
            .saveWatchProgress({
              movie_id: movieId,
              episode_id: ep.id,
              stopped_at_seconds: Number(data.progress.stopped_at_seconds || 0),
              duration_seconds: Math.max(1, Number(data.progress.duration_seconds || fallbackDuration)),
              is_ended: data.progress.watch_status === 'COMPLETED',
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isAuthenticated, watchData?.movie?.id, watchData?.current_episode, isControllableSource]);

  // Persist real Watch Progress to Backend (for controllable HLS/MP4 sources)
  const syncWatchProgress = useCallback(
    async ({ stopped_at_seconds, duration_seconds, is_ended = false, restart_from_zero = false }) => {
      const movieId = watchData?.movie?.id;
      const episodeId = watchData?.current_episode?.id;
      if (!isAuthenticated || !movieId || !episodeId || !isControllableSource) return;
      if (!duration_seconds || duration_seconds <= 0) return;

      const payload = {
        movie_id: movieId,
        episode_id: episodeId,
        stopped_at_seconds,
        duration_seconds,
        is_ended,
        restart_from_zero,
      };
      lastSnapshotRef.current = payload;

      try {
        await interactionsApi.saveWatchProgress(payload);
      } catch {
        // Silent background sync error
      }
    },
    [isAuthenticated, watchData?.movie?.id, watchData?.current_episode?.id, isControllableSource]
  );

  // Keepalive flush on tab close / pagehide
  useEffect(() => {
    const handlePageHide = () => {
      if (lastSnapshotRef.current) {
        interactionsApi.saveWatchProgressKeepalive(lastSnapshotRef.current);
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      if (lastSnapshotRef.current) {
        interactionsApi.saveWatchProgressKeepalive(lastSnapshotRef.current);
      }
    };
  }, []);

  const handleResumeConfirm = () => {
    const seconds = Number(resumePromptData?.stopped_at_seconds || 0);
    setResumePromptData(null);
    setSeekCommand({ seconds, autoPlay: true, key: Date.now() });
  };

  const handleRestartFromZero = async () => {
    const duration = Number(resumePromptData?.duration_seconds || 1);
    setResumePromptData(null);
    setSeekCommand({ seconds: 0, autoPlay: true, key: Date.now() });
    await syncWatchProgress({
      stopped_at_seconds: 0,
      duration_seconds: duration,
      is_ended: false,
      restart_from_zero: true,
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!watchData?.movie?.id || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      await interactionsApi.reportMovieError(watchData.movie.id, {
        reason: reportReason,
        description: reportDesc.trim() || null,
        episode_id: watchData.current_episode?.id || null,
        video_source_id: activeSource?.id || null,
      });
      toast.success('Cảm ơn bạn đã báo lỗi! Quản trị viên sẽ kiểm tra và khắc phục sớm.');
      setReportOpen(false);
      setReportDesc('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể gửi báo lỗi lúc này.'));
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-7xl flex-col items-center justify-center gap-3 px-4 py-12">
        <Loader2 className="h-9 w-9 animate-spin text-cinema-red" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Đang tải trình phát phim...</p>
      </div>
    );
  }

  // Premium Gate (403 PREMIUM_REQUIRED)
  if (premiumBlocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-cinema-surface p-8 text-center shadow-2xl sm:p-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl" />

          <div className="relative z-10 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/30">
              <Crown className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Nội dung dành riêng cho Premium
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                Nâng cấp tài khoản để xem bộ phim này
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {premiumBlocked.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-transform hover:scale-[1.02]"
              >
                <Crown className="h-4 w-4" />
                Xem các gói Premium
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-3 text-sm font-bold text-white hover:bg-cinema-redHover"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập tài khoản
                </Link>
              )}

              <Link
                to={`/movies/${slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại chi tiết phim
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFoundMsg || !watchData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          icon={Film}
          title="Không thể phát tập phim này"
          description={notFoundMsg || 'Tập phim bạn chọn hiện không khả dụng.'}
          action={
            <Link
              to={`/movies/${slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang phim
            </Link>
          }
        />
      </div>
    );
  }

  const { movie, current_episode: episode, prev_episode: prevEp, next_episode: nextEp, episodes } =
    watchData;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Resume Watch Modal ("Tiếp tục xem?") */}
      {resumePromptData && (
        <ResumeWatchModal
          progress={resumePromptData}
          onResume={handleResumeConfirm}
          onRestart={handleRestartFromZero}
        />
      )}

      {/* Report Error Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-cinema-card hover:text-slate-900 dark:hover:text-white"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-cinema-red">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Báo lỗi nguồn phát
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {movie.name} — {episode.title || `Tập ${episode.episode_number}`}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chọn vấn đề gặp phải
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mô tả chi tiết (không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Ví dụ: Video bị đứng ở phút thứ 15, không có tiếng..."
                  className="w-full rounded-xl border border-cinema-border bg-cinema-bg p-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cinema-red dark:text-white dark:placeholder-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-xl border border-cinema-border px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-xs font-semibold text-white hover:bg-cinema-redHover disabled:opacity-50"
                >
                  {reportSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Gửi báo lỗi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumb & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white">
              Trang chủ
            </Link>
            <span>/</span>
            <Link
              to={`/movies/${movie.slug}`}
              className="truncate hover:text-slate-900 dark:hover:text-white"
            >
              {movie.name}
            </Link>
            <span>/</span>
            <span className="font-semibold text-cinema-red">
              {episode.title || `Tập ${episode.episode_number}`}
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
            {movie.name} —{' '}
            <span className="text-cinema-red">
              {episode.title || `Tập ${episode.episode_number}`}
            </span>
          </h1>
        </div>

        <Link
          to={`/movies/${movie.slug}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
        >
          <Info className="h-4 w-4" />
          Chi tiết phim
        </Link>
      </div>

      {/* Main Video Player */}
      <VideoPlayer
        source={activeSource}
        pauseForResumeModal={Boolean(resumePromptData)}
        seekCommand={seekCommand}
        onTimeSync={syncWatchProgress}
        onPauseSync={syncWatchProgress}
        onEndedSync={syncWatchProgress}
      />

      {/* Server Selector & Controls Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cinema-border bg-cinema-surface p-4 shadow-sm lg:flex-row lg:items-center dark:shadow-none">
        <ServerSelector
          sources={episode.sources || []}
          activeSourceId={activeSource?.id}
          onSelect={(src) => setActiveSource(src)}
        />

        <div className="flex flex-wrap items-center gap-2">
          {prevEp && (
            <Link
              to={`/watch/${movie.slug}/${prevEp.slug}`}
              className="inline-flex items-center gap-1 rounded-xl border border-cinema-border bg-cinema-card px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Tập trước
            </Link>
          )}

          {nextEp && (
            <Link
              to={`/watch/${movie.slug}/${nextEp.slug}`}
              className="inline-flex items-center gap-1 rounded-xl bg-cinema-red px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-cinema-redHover"
            >
              Tập tiếp theo
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60 dark:hover:text-red-200"
          >
            <Flag className="h-3.5 w-3.5" />
            Báo lỗi nguồn phát
          </button>
        </div>
      </div>

      {/* Episode Grid */}
      <EpisodeGrid
        movieSlug={movie.slug}
        episodes={episodes || []}
        activeEpisodeSlug={episode.slug}
      />

      {/* Episode Comments */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEpisodeOnlyComments(true)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              episodeOnlyComments
                ? 'bg-cinema-red text-white'
                : 'border border-cinema-border bg-cinema-surface text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Bình luận tập này
          </button>
          <button
            type="button"
            onClick={() => setEpisodeOnlyComments(false)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              !episodeOnlyComments
                ? 'bg-cinema-red text-white'
                : 'border border-cinema-border bg-cinema-surface text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Tất cả bình luận phim
          </button>
        </div>

        <CommentsSection
          movieId={movie.id}
          episodeId={episodeOnlyComments ? episode.id : null}
          title={
            episodeOnlyComments
              ? `Bình luận ${episode.title || `Tập ${episode.episode_number}`}`
              : 'Tất cả bình luận phim'
          }
        />
      </div>
    </div>
  );
}
