import {
  AlertTriangle,
  Clock,
  Crown,
  Film,
  History,
  Loader2,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interactionsApi } from '../../api/interactionsApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDate, getApiErrorMessage } from '../../utils/formatters.js';

export default function HistoryPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const loadHistory = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await interactionsApi.listWatchHistory({ page, limit: 12 });
        setItems(res?.data || []);
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải lịch sử xem phim.'));
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  const handleDeleteOne = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await interactionsApi.deleteWatchHistory(id);
      toast.success('Đã xóa khỏi lịch sử xem.');
      const nextItems = items.filter((item) => item.id !== id);
      if (nextItems.length === 0 && meta.page > 1) {
        loadHistory(meta.page - 1);
      } else {
        loadHistory(meta.page);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa mục lịch sử này.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await interactionsApi.clearAllWatchHistory();
      setItems([]);
      setMeta({ page: 1, totalPages: 1, total: 0 });
      setClearModalOpen(false);
      toast.success('Đã xóa toàn bộ lịch sử xem phim.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa toàn bộ lịch sử.'));
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Clear All Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setClearModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-cinema-card hover:text-slate-900 dark:hover:text-white"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-cinema-red">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Xóa toàn bộ lịch sử xem?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Tất cả các bộ phim và tập đã lưu trong lịch sử xem của bạn sẽ bị xóa vĩnh viễn và
              không thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={clearingAll}
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-4 py-2 text-sm font-semibold text-white hover:bg-cinema-redHover disabled:opacity-60"
              >
                {clearingAll && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận xóa hết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-red/15 text-cinema-red">
              <History className="h-5 w-5" />
            </span>
            Lịch sử xem phim
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Danh sách {meta.total || 0} tập phim bạn đã mở gần đây nhất.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setClearModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
          >
            <Trash2 className="h-4 w-4" />
            Xóa toàn bộ lịch sử
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface"
            >
              <div className="aspect-video bg-cinema-card" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-cinema-card" />
                <div className="h-3 w-1/2 rounded bg-cinema-card" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Chưa có lịch sử xem phim"
          description="Những bộ phim bạn mở xem sẽ tự động xuất hiện tại đây để bạn dễ dàng theo dõi và xem tiếp bất cứ lúc nào."
          action={
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
            >
              <Film className="h-4 w-4" />
              Khám phá kho phim
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const stoppedSec = Number(item.stopped_at_seconds || 0);
              const durationSec = Number(item.duration_seconds || 0);
              const hasRealProgress = stoppedSec > 0 && durationSec > 0;
              const pct = hasRealProgress
                ? Math.min(100, Math.max(0, Number(item.progress_percent || 0)))
                : 0;
              const cardImg = item.banner_url || item.poster_url || item.thumbnail_url;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-cinema-red dark:shadow-none"
                >
                  <Link
                    to={`/watch/${item.movie_slug}/${item.episode_slug}`}
                    className="relative aspect-video w-full overflow-hidden bg-cinema-card"
                  >
                    {cardImg ? (
                      <img
                        src={cardImg}
                        alt={item.movie_name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Film className="h-9 w-9" />
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

                    {item.access_type === 'PREMIUM' && (
                      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-950">
                        <Crown className="h-3 w-3" />
                        Premium
                      </span>
                    )}

                    <span className="absolute bottom-2.5 left-2.5 rounded bg-cinema-red/90 px-2 py-0.5 text-[11px] font-bold text-white">
                      {item.episode_title || `Tập ${item.episode_number}`}
                    </span>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cinema-red text-white shadow-xl">
                        <Play className="ml-0.5 h-5 w-5 fill-white" />
                      </span>
                    </div>

                    {hasRealProgress && pct > 0 && (
                      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60">
                        <div className="h-full bg-cinema-red" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </Link>

                  {/* Delete single button */}
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={(e) => handleDeleteOne(e, item.id)}
                    title="Xóa khỏi lịch sử"
                    className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm transition-colors hover:bg-cinema-red disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <div>
                      <Link
                        to={`/watch/${item.movie_slug}/${item.episode_slug}`}
                        className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors hover:text-cinema-red dark:text-white"
                      >
                        {item.movie_name}
                      </Link>
                      {hasRealProgress && (
                        <p className="mt-1 text-xs font-medium text-cinema-red">
                          Đã xem: {item.stopped_at_formatted} / {item.duration_formatted}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.last_watched_at, { withTime: true })}
                      </span>
                      <Link
                        to={`/movies/${item.movie_slug}`}
                        className="font-semibold hover:text-cinema-red"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => {
              loadHistory(nextPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
