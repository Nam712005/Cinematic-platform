import {
  CloudDownload,
  Crown,
  Edit3,
  Film,
  Globe,
  Link2,
  Loader2,
  PlaySquare,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi.js';
import { moviesApi } from '../../api/moviesApi.js';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

const MOVIE_PROVIDERS = [
  { code: 'NGUONC', label: 'NguonC', hint: 'phim.nguonc.com' },
  { code: 'KKPHIM', label: 'KKPhim', hint: 'phimapi.com' },
  { code: 'OPHIM', label: 'OPhim', hint: 'ophim1.com' },
];

const EMPTY_MOVIE_FORM = {
  name: '',
  origin_name: '',
  slug: '',
  thumbnail_url: '',
  banner_url: '',
  poster_url: '',
  release_year: new Date().getFullYear(),
  duration_minutes: 90,
  quality: 'HD',
  language: 'Vietsub',
  type: 'SINGLE',
  access_type: 'FREE',
  movie_status: 'COMPLETED',
  total_episodes: 1,
  current_episode_info: 'Full',
  status: 1,
  is_featured: false,
  description: '',
  genre_ids: [],
  country_ids: [],
  category_ids: [],
};

export default function AdminMoviesPage() {
  const toast = useToast();

  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [taxonomy, setTaxonomy] = useState({ genres: [], countries: [], categories: [] });

  // Filters
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  // Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_MOVIE_FORM);
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Multi-Provider Movie Import Modal
  const [importOpen, setImportOpen] = useState(false);
  const [importProvider, setImportProvider] = useState('NGUONC');
  const [importTab, setImportTab] = useState('search'); // 'search' | 'url'
  const [nguoncKeyword, setNguoncKeyword] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [nguoncResults, setNguoncResults] = useState([]);
  const [searchingNguonc, setSearchingNguonc] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importAccess, setImportAccess] = useState('FREE');
  const [importFeatured, setImportFeatured] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    moviesApi
      .getTaxonomyAll()
      .then((res) => {
        if (res?.data) {
          setTaxonomy({
            genres: res.data.genres || [],
            countries: res.data.countries || [],
            categories: res.data.categories || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const loadMovies = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (debouncedQ) params.q = debouncedQ;
        if (accessFilter) params.access_type = accessFilter;
        if (genreFilter) params.genre_id = genreFilter;
        const res = await adminApi.listMovies(params);
        setMovies(res?.data || []);
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải danh sách phim.'));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, accessFilter, genreFilter, toast]
  );

  useEffect(() => {
    loadMovies(1);
  }, [loadMovies]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_MOVIE_FORM);
    setModalOpen(true);
  };

  const openEditModal = async (movieId) => {
    try {
      const res = await adminApi.getMovie(movieId);
      const m = res.data;
      setEditingId(m.id);
      setForm({
        name: m.name || '',
        origin_name: m.origin_name || '',
        slug: m.slug || '',
        thumbnail_url: m.thumbnail_url || '',
        banner_url: m.banner_url || '',
        poster_url: m.poster_url || '',
        release_year: m.release_year || '',
        duration_minutes: m.duration_minutes || '',
        quality: m.quality || 'HD',
        language: m.language || '',
        type: m.type || 'SINGLE',
        access_type: m.access_type || 'FREE',
        movie_status: m.movie_status || 'COMPLETED',
        total_episodes: m.total_episodes || 1,
        current_episode_info: m.current_episode_info || '',
        status: m.status ?? 1,
        is_featured: Boolean(m.is_featured),
        description: m.description || '',
        genre_ids: (m.genres || []).map((g) => g.id),
        country_ids: (m.countries || []).map((c) => c.id),
        category_ids: (m.categories || []).map((c) => c.id),
      });
      setModalOpen(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải chi tiết phim.'));
    }
  };

  const toggleIdInArray = (field, id) => {
    setForm((prev) => {
      const exists = prev[field].includes(id);
      return {
        ...prev,
        [field]: exists ? prev[field].filter((x) => x !== id) : [...prev[field], id],
      };
    });
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Vui lòng nhập tên phim.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        origin_name: form.origin_name.trim() || null,
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
        thumbnail_url: form.thumbnail_url.trim() || null,
        banner_url: form.banner_url.trim() || null,
        poster_url: (form.poster_url || form.banner_url || form.thumbnail_url).trim() || null,
        release_year: form.release_year ? Number(form.release_year) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        quality: form.quality.trim() || 'HD',
        language: form.language.trim() || null,
        type: form.type,
        access_type: form.access_type,
        movie_status: form.movie_status,
        total_episodes: Math.max(1, Number(form.total_episodes) || 1),
        current_episode_info: form.current_episode_info.trim() || null,
        status: Number(form.status),
        is_featured: Boolean(form.is_featured),
        description: form.description.trim() || null,
        genre_ids: form.genre_ids,
        country_ids: form.country_ids,
        category_ids: form.category_ids,
      };

      if (editingId) {
        await adminApi.updateMovie(editingId, payload);
        toast.success('Đã cập nhật thông tin phim.');
      } else {
        await adminApi.createMovie(payload);
        toast.success('Đã thêm phim mới thành công.');
      }
      setModalOpen(false);
      loadMovies(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu thông tin phim.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteMovie(deleteTarget.id);
      toast.success(`Đã xóa phim "${deleteTarget.name}".`);
      setDeleteTarget(null);
      loadMovies(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa phim.'));
    } finally {
      setDeleting(false);
    }
  };

  // Multi-Provider Search, URL Preview & Import
  const handleSearchNguonc = async (e) => {
    e.preventDefault();
    setSearchingNguonc(true);
    setPreviewData(null);
    try {
      const res = await adminApi.searchNguonC({
        keyword: nguoncKeyword.trim(),
        page: 1,
        provider: importProvider,
      });
      setNguoncResults(res?.data?.items || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tìm phim trên Nguồn Phim API.'));
    } finally {
      setSearchingNguonc(false);
    }
  };

  const handlePreviewNguonc = async (slug) => {
    setPreviewLoading(true);
    try {
      const res = await adminApi.previewNguonC(slug, importProvider);
      setPreviewData(res?.data || null);
      setImportAccess('FREE');
      setImportFeatured(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải xem trước phim từ Nguồn Phim.'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewByUrl = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) {
      toast.warning('Vui lòng dán đường dẫn (URL) phim cần nhập.');
      return;
    }
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await adminApi.previewMovieByUrl(importUrl.trim(), importProvider);
      setPreviewData(res?.data || null);
      if (res?.data?.detected_provider) {
        setImportProvider(res.data.detected_provider);
      }
      setImportAccess('FREE');
      setImportFeatured(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể đọc dữ liệu phim từ đường dẫn URL này.'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    setImporting(true);
    try {
      const {
        already_exists_in_db,
        existing_movie_id,
        source_meta,
        detected_provider,
        detected_slug,
        ...cleanPayload
      } = previewData;
      await adminApi.importNguonC({
        ...cleanPayload,
        access_type: importAccess,
        is_featured: importFeatured,
      });
      toast.success(`Đã nhập phim "${previewData.name}" vào hệ thống!`);
      setPreviewData(null);
      setImportUrl('');
      setImportOpen(false);
      loadMovies(1);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể nhập phim từ Nguồn Phim API.'));
    } finally {
      setImporting(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Film className="h-6 w-6 text-cinema-red" />
            Quản lý phim ({meta.total || 0})
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Thêm phim thủ công, nhập nhanh từ Nguồn Phim API, phân loại Free/Premium và quản lý tập
            phim.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setImportOpen(true);
              setPreviewData(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
          >
            <CloudDownload className="h-4 w-4" />
            Nhập từ Nguồn Phim API
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white shadow-md shadow-cinema-red/25 hover:bg-cinema-redHover"
          >
            <Plus className="h-4 w-4" />
            Thêm phim mới
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên phim, tên gốc, slug..."
            className="w-full rounded-xl border border-cinema-border bg-cinema-bg py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Xóa từ khóa"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 outline-none focus:border-cinema-red dark:text-slate-200"
        >
          <option value="">Tất cả loại phim</option>
          <option value="FREE">Miễn phí</option>
          <option value="PREMIUM">Premium</option>
        </select>

        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 outline-none focus:border-cinema-red dark:text-slate-200"
        >
          <option value="">Tất cả thể loại</option>
          {taxonomy.genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Movies Table */}
      <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
          </div>
        ) : movies.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Không tìm thấy phim nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cinema-border bg-cinema-card/70 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="px-4 py-3.5 font-bold">Phim</th>
                  <th className="px-4 py-3.5 font-bold">Định dạng</th>
                  <th className="px-4 py-3.5 font-bold">Loại</th>
                  <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                  <th className="px-4 py-3.5 font-bold">Lượt xem</th>
                  <th className="px-4 py-3.5 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-cinema-card/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.thumbnail_url || m.poster_url || ''}
                          alt={m.name}
                          className="h-14 w-10 shrink-0 rounded-lg border border-cinema-border bg-cinema-card object-cover"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-bold text-slate-900 dark:text-white">
                            {m.name}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {m.origin_name || m.slug} • {m.release_year || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {m.type === 'SINGLE' ? 'Phim lẻ' : `Phim bộ (${m.total_episodes || 1} tập)`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {m.access_type === 'PREMIUM' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <Crown className="h-3 w-3" />
                          Premium
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Miễn phí
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          m.status === 1
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/15 text-slate-500'
                        }`}
                      >
                        {m.status === 1 ? 'Hiển thị' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {Number(m.view_count || 0).toLocaleString('vi-VN')}
                      </p>
                      <p className="inline-flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {Number(m.rating_avg || 0).toFixed(1)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/movies/${m.id}/episodes`}
                          title="Quản lý tập phim & nguồn phát"
                          className="inline-flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-card px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-cinema-red hover:text-cinema-red dark:text-slate-200"
                        >
                          <PlaySquare className="h-3.5 w-3.5" />
                          Tập
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(m.id)}
                          title="Sửa phim"
                          className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-amber-500 hover:text-amber-500 dark:text-slate-200"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(m)}
                          title="Xóa phim"
                          className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-red-500 hover:text-red-500 dark:text-slate-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(p) => loadMovies(p)} />

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận xóa phim</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc muốn xóa vĩnh viễn phim <strong>{deleteTarget.name}</strong> cùng toàn bộ
              tập phim và nguồn phát liên quan?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteMovie}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white hover:bg-cinema-redHover disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xóa phim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Movie Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-cinema-border px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Chỉnh sửa thông tin phim' : 'Thêm phim mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Tên phim *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Tên gốc
                  </label>
                  <input
                    value={form.origin_name}
                    onChange={(e) => setForm((p) => ({ ...p, origin_name: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Slug (để trống tự sinh)
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Định dạng
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="SINGLE">Phim lẻ</option>
                    <option value="SERIES">Phim bộ</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Gói truy cập
                  </label>
                  <select
                    value={form.access_type}
                    onChange={(e) => setForm((p) => ({ ...p, access_type: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="FREE">Miễn phí</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Năm phát hành
                  </label>
                  <input
                    type="number"
                    value={form.release_year}
                    onChange={(e) => setForm((p) => ({ ...p, release_year: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Chất lượng
                  </label>
                  <input
                    value={form.quality}
                    onChange={(e) => setForm((p) => ({ ...p, quality: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Trạng thái phim
                  </label>
                  <select
                    value={form.movie_status}
                    onChange={(e) => setForm((p) => ({ ...p, movie_status: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="COMPLETED">Hoàn tất</option>
                    <option value="ONGOING">Đang chiếu</option>
                    <option value="UPCOMING">Sắp chiếu</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    URL Poster dọc (2:3)
                  </label>
                  <input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm((p) => ({ ...p, thumbnail_url: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    URL Banner ngang (16:9)
                  </label>
                  <input
                    value={form.banner_url}
                    onChange={(e) => setForm((p) => ({ ...p, banner_url: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Mô tả phim
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* Genres Checkboxes */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Thể loại
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.genres.map((g) => {
                    const selected = form.genre_ids.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleIdInArray('genre_ids', g.id)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          selected
                            ? 'border-cinema-red bg-cinema-red text-white'
                            : 'border-cinema-border bg-cinema-card text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Countries Checkboxes */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Quốc gia
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.countries.map((c) => {
                    const selected = form.country_ids.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleIdInArray('country_ids', c.id)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          selected
                            ? 'border-cinema-red bg-cinema-red text-white'
                            : 'border-cinema-border bg-cinema-card text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories Checkboxes */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Danh mục
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.categories.map((cat) => {
                    const selected = form.category_ids.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleIdInArray('category_ids', cat.id)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          selected
                            ? 'border-cinema-red bg-cinema-red text-white'
                            : 'border-cinema-border bg-cinema-card text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                  />
                  Hiển thị trên Hero Spotlight
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.status === 1}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked ? 1 : 0 }))}
                  />
                  Công khai hiển thị
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-cinema-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-5 py-2 text-xs font-bold text-white hover:bg-cinema-redHover disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? 'Cập nhật phim' : 'Tạo phim mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Provider Movie Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-cinema-border px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <CloudDownload className="h-5 w-5 text-amber-500" />
                Nhập phim từ Nguồn Phim API
              </h3>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {/* Provider selector */}
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Globe className="h-3.5 w-3.5 text-amber-500" />
                  Chọn nguồn API phim
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {MOVIE_PROVIDERS.map((prov) => {
                    const active = importProvider === prov.code;
                    return (
                      <button
                        key={prov.code}
                        type="button"
                        onClick={() => {
                          setImportProvider(prov.code);
                          setNguoncResults([]);
                          setPreviewData(null);
                        }}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                          active
                            ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'border-cinema-border bg-cinema-card text-slate-700 hover:border-amber-500/60 dark:text-slate-200'
                        }`}
                      >
                        <p className="text-xs font-extrabold">{prov.label}</p>
                        <p className="truncate text-[10px] opacity-75">{prov.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex gap-2 border-b border-cinema-border pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportTab('search');
                    setPreviewData(null);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    importTab === 'search'
                      ? 'bg-cinema-red text-white shadow-sm'
                      : 'border border-cinema-border bg-cinema-card text-slate-700 hover:border-cinema-red dark:text-slate-200'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  Tìm theo tên phim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportTab('url');
                    setPreviewData(null);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    importTab === 'url'
                      ? 'bg-cinema-red text-white shadow-sm'
                      : 'border border-cinema-border bg-cinema-card text-slate-700 hover:border-cinema-red dark:text-slate-200'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Nhập bằng Link URL
                </button>
              </div>

              {/* Tab 1: Search by keyword */}
              {importTab === 'search' ? (
                <form onSubmit={handleSearchNguonc} className="flex gap-2">
                  <input
                    value={nguoncKeyword}
                    onChange={(e) => setNguoncKeyword(e.target.value)}
                    placeholder={`Nhập tên phim cần tìm trên ${
                      MOVIE_PROVIDERS.find((p) => p.code === importProvider)?.label || 'Nguồn Phim'
                    }...`}
                    className={inputCls}
                  />
                  <button
                    type="submit"
                    disabled={searchingNguonc}
                    className="shrink-0 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white hover:bg-cinema-redHover disabled:opacity-60"
                  >
                    {searchingNguonc ? 'Đang tìm...' : 'Tìm phim'}
                  </button>
                </form>
              ) : (
                /* Tab 2: Import directly via URL */
                <form onSubmit={handlePreviewByUrl} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="Dán link phim (VD: https://phim.nguonc.com/phim/linh-vu-dai-luc)"
                      className={inputCls}
                    />
                    <button
                      type="submit"
                      disabled={previewLoading}
                      className="shrink-0 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white hover:bg-cinema-redHover disabled:opacity-60"
                    >
                      {previewLoading ? 'Đang lấy...' : 'Lấy thông tin'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hỗ trợ link trang chi tiết hoặc link API của <strong>NguonC</strong>,{' '}
                    <strong>KKPhim</strong> và <strong>OPhim</strong> — hệ thống tự nhận diện nguồn
                    và bóc tách slug.
                  </p>
                </form>
              )}

              {previewLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cinema-red" />
                </div>
              )}

              {previewData ? (
                <div className="space-y-4 rounded-2xl border border-amber-500/40 bg-cinema-card p-4">
                  <div className="flex gap-4">
                    <img
                      src={previewData.thumbnail_url || previewData.poster_url || ''}
                      alt={previewData.name}
                      className="h-28 w-20 shrink-0 rounded-xl border border-cinema-border object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {previewData.name}
                        </h4>
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                          {previewData.external_source || importProvider}
                        </span>
                      </div>
                      <p className="text-slate-500">{previewData.origin_name}</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        Năm: {previewData.release_year || '—'} • Tập:{' '}
                        {previewData.episodes?.length || 0} • Loại:{' '}
                        {previewData.type === 'SERIES' ? 'Phim bộ' : 'Phim lẻ'}
                      </p>
                      {previewData.already_exists_in_db && (
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          Phim này đã tồn tại trong cơ sở dữ liệu!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      value={importAccess}
                      onChange={(e) => setImportAccess(e.target.value)}
                      className="rounded-xl border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="FREE">Gán nhãn: Miễn phí</option>
                      <option value="PREMIUM">Gán nhãn: Premium</option>
                    </select>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={importFeatured}
                        onChange={(e) => setImportFeatured(e.target.checked)}
                      />
                      Đưa lên Hero Spotlight
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewData(null)}
                      className="rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Chọn phim khác
                    </button>
                    <button
                      type="button"
                      disabled={importing || previewData.already_exists_in_db}
                      onClick={handleConfirmImport}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Nhập vào CINEMATIC
                    </button>
                  </div>
                </div>
              ) : importTab === 'search' ? (
                <div className="divide-y divide-cinema-border rounded-xl border border-cinema-border">
                  {nguoncResults.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-500">
                      Nhập từ khóa và bấm Tìm phim để xem danh sách từ{' '}
                      {MOVIE_PROVIDERS.find((p) => p.code === importProvider)?.label}.
                    </p>
                  ) : (
                    nguoncResults.slice(0, 12).map((item) => (
                      <div
                        key={item.slug}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={item.thumb_url || item.poster_url || ''}
                            alt={item.name}
                            className="h-12 w-9 shrink-0 rounded border border-cinema-border object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="truncate text-slate-500">
                              {item.current_episode || 'Full'} • {item.quality || 'HD'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePreviewNguonc(item.slug)}
                          className="shrink-0 rounded-lg border border-cinema-border bg-cinema-card px-3 py-1.5 font-semibold text-slate-800 hover:border-cinema-red hover:text-cinema-red dark:text-slate-200"
                        >
                          Xem trước
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                !previewLoading && (
                  <div className="rounded-xl border border-dashed border-cinema-border py-8 text-center text-xs text-slate-500">
                    Dán đường dẫn phim từ NguonC, KKPhim hoặc OPhim rồi bấm{' '}
                    <strong>Lấy thông tin</strong> để xem trước và nhập vào kho phim.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
