import { AlertTriangle, Film, Heart, HeartOff, Loader2, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interactionsApi } from '../../api/interactionsApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import MovieCard from '../../components/common/MovieCard.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { MovieGridSkeleton } from '../../components/common/Skeleton.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

export default function FavoritesPage() {
  const toast = useToast();

  const [typeFilter, setTypeFilter] = useState('');
  const [movies, setMovies] = useState([]);
  const [counts, setCounts] = useState({ all: 0, single: 0, series: 0 });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const loadFavorites = useCallback(
    async (page = 1, activeType = typeFilter) => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (activeType) params.type = activeType;
        const res = await interactionsApi.listFavorites(params);
        setMovies(res?.data?.items || []);
        setCounts(res?.data?.counts || { all: 0, single: 0, series: 0 });
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải danh sách phim yêu thích.'));
        setMovies([]);
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, toast]
  );

  useEffect(() => {
    loadFavorites(1, typeFilter);
  }, [typeFilter, loadFavorites]);

  const handleRemoveFavorite = async (e, movieId) => {
    e.preventDefault();
    e.stopPropagation();
    if (removingId) return;
    setRemovingId(movieId);
    try {
      await interactionsApi.removeFavorite(movieId);
      toast.success('Đã bỏ khỏi danh sách phim yêu thích.');
      const nextMovies = movies.filter((m) => m.id !== movieId);
      if (nextMovies.length === 0 && meta.page > 1) {
        loadFavorites(meta.page - 1, typeFilter);
      } else {
        loadFavorites(meta.page, typeFilter);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể bỏ yêu thích phim này.'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await interactionsApi.clearAllFavorites();
      setMovies([]);
      setCounts({ all: 0, single: 0, series: 0 });
      setMeta({ page: 1, totalPages: 1, total: 0 });
      setClearModalOpen(false);
      toast.success('Đã xóa toàn bộ danh sách phim yêu thích.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa danh sách yêu thích.'));
    } finally {
      setClearingAll(false);
    }
  };

  const tabs = [
    { value: '', label: `Tất cả (${counts.all})` },
    { value: 'SINGLE', label: `Phim lẻ (${counts.single})` },
    { value: 'SERIES', label: `Phim bộ (${counts.series})` },
  ];

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
              Xóa toàn bộ phim yêu thích?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc muốn bỏ yêu thích tất cả {counts.all} bộ phim đã lưu không?
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
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
              <Heart className="h-5 w-5 fill-cinema-red" />
            </span>
            Phim yêu thích
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Bộ sưu tập các bộ phim lẻ và phim bộ bạn đã lưu để xem lại sau.
          </p>
        </div>

        {counts.all > 0 && (
          <button
            type="button"
            onClick={() => setClearModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
          >
            <Trash2 className="h-4 w-4" />
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Type Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const active = typeFilter === tab.value;
          return (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                  : 'border border-cinema-border bg-cinema-surface text-slate-700 hover:border-cinema-red hover:text-cinema-red dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Movie Grid */}
      {loading ? (
        <MovieGridSkeleton count={10} />
      ) : movies.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={
            typeFilter
              ? 'Không có phim yêu thích ở mục này'
              : 'Danh sách phim yêu thích đang trống'
          }
          description="Hãy bấm nút Yêu thích trên trang chi tiết bộ phim bạn muốn lưu lại để xem bất cứ khi nào."
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie) => (
              <div key={movie.id} className="relative">
                <MovieCard movie={movie} />
                <button
                  type="button"
                  disabled={removingId === movie.id}
                  onClick={(e) => handleRemoveFavorite(e, movie.id)}
                  title="Bỏ yêu thích"
                  aria-label={`Bỏ yêu thích ${movie.name}`}
                  className="absolute bottom-[78px] right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/75 text-white backdrop-blur-sm transition-colors hover:border-cinema-red hover:bg-cinema-red disabled:opacity-60"
                >
                  {removingId === movie.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <HeartOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => {
              loadFavorites(nextPage, typeFilter);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
