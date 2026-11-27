import {
  CheckCircle2,
  Edit3,
  Flag,
  Loader2,
  PlaySquare,
  Plus,
  Server,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDate, getApiErrorMessage } from '../../utils/formatters.js';

export default function AdminEpisodesPage() {
  const { id: routeMovieId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('episodes'); // episodes | reports
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(routeMovieId ? Number(routeMovieId) : '');
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Episode Modal
  const [epModal, setEpModal] = useState(false);
  const [editingEpId, setEditingEpId] = useState(null);
  const [epForm, setEpForm] = useState({
    episode_number: 1,
    title: '',
    slug: '',
    duration_seconds: '',
    status: 1,
  });
  const [savingEp, setSavingEp] = useState(false);

  // Source Modal
  const [srcModal, setSrcModal] = useState(false);
  const [srcEpisodeId, setSrcEpisodeId] = useState(null);
  const [editingSrcId, setEditingSrcId] = useState(null);
  const [srcForm, setSrcForm] = useState({
    source_name: 'Vietsub #1',
    video_url: '',
    quality: 'HD',
    format_type: 'EMBED',
    is_default: true,
    status: 1,
  });
  const [savingSrc, setSavingSrc] = useState(false);

  // Movie Error Reports tab
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    adminApi
      .listMovies({ page: 1, limit: 100 })
      .then((res) => {
        const list = res?.data || [];
        setMovies(list);
        if (!routeMovieId && list.length > 0) {
          setSelectedMovieId((prev) => prev || list[0].id);
        }
      })
      .catch(() => {});
  }, [routeMovieId]);

  useEffect(() => {
    if (routeMovieId) {
      setSelectedMovieId(Number(routeMovieId));
    }
  }, [routeMovieId]);

  const loadEpisodes = useCallback(async (movieId) => {
    if (!movieId) return;
    setLoadingEpisodes(true);
    try {
      const res = await adminApi.listEpisodes(movieId);
      setEpisodes(res?.data?.episodes || res?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải danh sách tập phim.'));
    } finally {
      setLoadingEpisodes(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedMovieId && tab === 'episodes') {
      loadEpisodes(selectedMovieId);
    }
  }, [selectedMovieId, tab, loadEpisodes]);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await adminApi.listMovieReports({ page: 1, limit: 30 });
      setReports(res?.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'reports') loadReports();
  }, [tab, loadReports]);

  const handleSaveEpisode = async (e) => {
    e.preventDefault();
    if (!selectedMovieId) return;
    setSavingEp(true);
    try {
      const payload = {
        episode_number: Number(epForm.episode_number),
        title: epForm.title.trim() || `Tập ${epForm.episode_number}`,
        ...(epForm.slug.trim() ? { slug: epForm.slug.trim() } : {}),
        duration_seconds: epForm.duration_seconds ? Number(epForm.duration_seconds) : null,
        status: Number(epForm.status),
      };
      if (editingEpId) {
        await adminApi.updateEpisode(editingEpId, payload);
        toast.success('Đã cập nhật tập phim.');
      } else {
        await adminApi.createEpisode(selectedMovieId, payload);
        toast.success('Đã thêm tập phim mới.');
      }
      setEpModal(false);
      loadEpisodes(selectedMovieId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu tập phim.'));
    } finally {
      setSavingEp(false);
    }
  };

  const handleDeleteEpisode = async (epId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tập phim này cùng các nguồn phát của nó?')) return;
    try {
      await adminApi.deleteEpisode(epId);
      toast.success('Đã xóa tập phim.');
      loadEpisodes(selectedMovieId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa tập phim.'));
    }
  };

  const handleSaveSource = async (e) => {
    e.preventDefault();
    setSavingSrc(true);
    try {
      const payload = {
        source_name: srcForm.source_name.trim(),
        video_url: srcForm.video_url.trim(),
        quality: srcForm.quality.trim() || 'HD',
        format_type: srcForm.format_type,
        is_default: Boolean(srcForm.is_default),
        status: Number(srcForm.status),
      };
      if (editingSrcId) {
        await adminApi.updateSource(editingSrcId, payload);
        toast.success('Đã cập nhật nguồn phát.');
      } else {
        await adminApi.createSource(srcEpisodeId, payload);
        toast.success('Đã thêm nguồn phát mới.');
      }
      setSrcModal(false);
      loadEpisodes(selectedMovieId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu nguồn phát.'));
    } finally {
      setSavingSrc(false);
    }
  };

  const handleDeleteSource = async (srcId) => {
    if (!window.confirm('Xóa nguồn phát này?')) return;
    try {
      await adminApi.deleteSource(srcId);
      toast.success('Đã xóa nguồn phát.');
      loadEpisodes(selectedMovieId);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa nguồn phát.'));
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await adminApi.resolveMovieReport(reportId, { status: 'RESOLVED' });
      toast.success('Đã đánh dấu xử lý xong báo lỗi.');
      loadReports();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật báo lỗi.'));
    }
  };

  const inputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <PlaySquare className="h-6 w-6 text-cinema-red" />
            Quản lý Tập phim &amp; Nguồn phát
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Thêm/sửa/xóa tập phim, cấu hình link phát (EMBED / HLS / MP4) và xử lý báo lỗi từ người
            xem.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('episodes')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold ${
              tab === 'episodes'
                ? 'bg-cinema-red text-white'
                : 'border border-cinema-border bg-cinema-surface text-slate-700 dark:text-slate-300'
            }`}
          >
            Tập phim &amp; Link phát
          </button>
          <button
            type="button"
            onClick={() => setTab('reports')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold ${
              tab === 'reports'
                ? 'bg-cinema-red text-white'
                : 'border border-cinema-border bg-cinema-surface text-slate-700 dark:text-slate-300'
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Báo lỗi nguồn phát
          </button>
        </div>
      </div>

      {tab === 'episodes' ? (
        <>
          {/* Movie selector + Add episode */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
            <div className="flex min-w-[260px] flex-1 items-center gap-3">
              <span className="shrink-0 text-xs font-bold uppercase text-slate-500">Chọn phim:</span>
              <select
                value={selectedMovieId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedMovieId(id);
                  navigate(`/admin/movies/${id}/episodes`, { replace: true });
                }}
                className="flex-1 rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-cinema-red dark:text-white"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.type === 'SINGLE' ? 'Phim lẻ' : 'Phim bộ'})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!selectedMovieId}
              onClick={() => {
                setEditingEpId(null);
                setEpForm({
                  episode_number: episodes.length + 1,
                  title: `Tập ${episodes.length + 1}`,
                  slug: `tap-${episodes.length + 1}`,
                  duration_seconds: '',
                  status: 1,
                });
                setEpModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white hover:bg-cinema-redHover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Thêm tập phim
            </button>
          </div>

          {loadingEpisodes ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
            </div>
          ) : episodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cinema-border bg-cinema-surface py-12 text-center text-sm text-slate-500">
              Bộ phim này chưa có tập phim nào. Hãy bấm &ldquo;Thêm tập phim&rdquo; để bắt đầu.
            </div>
          ) : (
            <div className="space-y-3">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="rounded-2xl border border-cinema-border bg-cinema-surface p-4 shadow-sm dark:shadow-none"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        #{ep.episode_number} — {ep.title || `Tập ${ep.episode_number}`}{' '}
                        <span className="font-mono text-xs font-normal text-slate-500">
                          ({ep.slug})
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSrcEpisodeId(ep.id);
                          setEditingSrcId(null);
                          setSrcForm({
                            source_name: 'Vietsub #1',
                            video_url: '',
                            quality: 'HD',
                            format_type: 'EMBED',
                            is_default: !(ep.sources && ep.sources.length > 0),
                            status: 1,
                          });
                          setSrcModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm nguồn phát
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEpId(ep.id);
                          setEpForm({
                            episode_number: ep.episode_number,
                            title: ep.title || '',
                            slug: ep.slug || '',
                            duration_seconds: ep.duration_seconds || '',
                            status: ep.status ?? 1,
                          });
                          setEpModal(true);
                        }}
                        className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-amber-500 dark:text-slate-200"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEpisode(ep.id)}
                        className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-red-500 hover:text-red-500 dark:text-slate-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sources list */}
                  <div className="mt-3 space-y-1.5 border-t border-cinema-border pt-3">
                    {!ep.sources || ep.sources.length === 0 ? (
                      <p className="text-xs text-slate-500">Chưa có link nguồn phát nào.</p>
                    ) : (
                      ep.sources.map((src) => (
                        <div
                          key={src.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cinema-border bg-cinema-card px-3 py-2 text-xs"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Server className="h-3.5 w-3.5 shrink-0 text-cinema-red" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {src.source_name}
                            </span>
                            <span className="rounded bg-cinema-surface px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                              {src.format_type} • {src.quality}
                            </span>
                            {src.is_default && (
                              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Mặc định
                              </span>
                            )}
                            <span className="truncate font-mono text-[11px] text-slate-500">
                              {src.video_url}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSrcEpisodeId(ep.id);
                                setEditingSrcId(src.id);
                                setSrcForm({
                                  source_name: src.source_name,
                                  video_url: src.video_url,
                                  quality: src.quality || 'HD',
                                  format_type: src.format_type || 'EMBED',
                                  is_default: Boolean(src.is_default),
                                  status: src.status ?? 1,
                                });
                                setSrcModal(true);
                              }}
                              className="rounded p-1 text-slate-500 hover:text-amber-500"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSource(src.id)}
                              className="rounded p-1 text-slate-500 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface">
          {loadingReports ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
            </div>
          ) : reports.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Chưa có báo lỗi nguồn phát nào từ người xem.
            </p>
          ) : (
            <div className="divide-y divide-cinema-border">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {rep.movie_name} {rep.episode_title ? `— ${rep.episode_title}` : ''}
                    </p>
                    <p className="font-semibold text-cinema-red">{rep.reason}</p>
                    {rep.description && (
                      <p className="text-slate-600 dark:text-slate-300">{rep.description}</p>
                    )}
                    <p className="text-slate-500">
                      Gửi lúc: {formatDate(rep.created_at, { withTime: true })}
                    </p>
                  </div>
                  <div>
                    {rep.status === 'RESOLVED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã xử lý
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id)}
                        className="rounded-xl bg-cinema-red px-3.5 py-1.5 font-bold text-white hover:bg-cinema-redHover"
                      >
                        Đánh dấu đã xử lý
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Episode Modal */}
      {epModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEpId ? 'Cập nhật tập phim' : 'Thêm tập phim mới'}
              </h3>
              <button type="button" onClick={() => setEpModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveEpisode} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold">Số tập *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={epForm.episode_number}
                  onChange={(e) => setEpForm((p) => ({ ...p, episode_number: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Tiêu đề tập</label>
                <input
                  value={epForm.title}
                  onChange={(e) => setEpForm((p) => ({ ...p, title: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Slug tập</label>
                <input
                  value={epForm.slug}
                  onChange={(e) => setEpForm((p) => ({ ...p, slug: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEpModal(false)}
                  className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEp}
                  className="rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white"
                >
                  {savingEp ? 'Đang lưu...' : 'Lưu tập phim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Source Modal */}
      {srcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSrcId ? 'Chỉnh sửa nguồn phát' : 'Thêm nguồn phát mới'}
              </h3>
              <button type="button" onClick={() => setSrcModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveSource} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold">Tên server *</label>
                <input
                  required
                  value={srcForm.source_name}
                  onChange={(e) => setSrcForm((p) => ({ ...p, source_name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">URL nguồn phát *</label>
                <input
                  required
                  value={srcForm.video_url}
                  onChange={(e) => setSrcForm((p) => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Định dạng</label>
                  <select
                    value={srcForm.format_type}
                    onChange={(e) => setSrcForm((p) => ({ ...p, format_type: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="EMBED">EMBED</option>
                    <option value="HLS">HLS (.m3u8)</option>
                    <option value="MP4">MP4</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Chất lượng</label>
                  <input
                    value={srcForm.quality}
                    onChange={(e) => setSrcForm((p) => ({ ...p, quality: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={srcForm.is_default}
                  onChange={(e) => setSrcForm((p) => ({ ...p, is_default: e.target.checked }))}
                />
                Đặt làm nguồn phát mặc định
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSrcModal(false)}
                  className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingSrc}
                  className="rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white"
                >
                  {savingSrc ? 'Đang lưu...' : 'Lưu nguồn phát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
