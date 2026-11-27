import { Eye, EyeOff, Loader2, MessageSquareText, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDate, getApiErrorMessage } from '../../utils/formatters.js';

export default function AdminCommentsPage() {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const loadComments = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (debouncedQ) params.q = debouncedQ;
        if (statusFilter !== '') params.status = statusFilter;
        const res = await adminApi.listComments(params);
        setComments(res?.data?.items || res?.data || []);
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải danh sách bình luận.'));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, statusFilter, toast]
  );

  useEffect(() => {
    loadComments(1);
  }, [loadComments]);

  const handleToggleStatus = async (c) => {
    const nextStatus = c.status === 1 ? 0 : 1;
    try {
      await adminApi.updateCommentStatus(c.id, {
        status: nextStatus,
        hidden_reason: nextStatus === 0 ? 'Bình luận bị ẩn bởi quản trị viên' : null,
      });
      toast.success(nextStatus === 0 ? 'Đã ẩn bình luận.' : 'Đã hiển thị lại bình luận.');
      loadComments(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái bình luận.'));
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm('Xác nhận xóa vĩnh viễn bình luận này?')) return;
    try {
      await adminApi.deleteComment(c.id);
      toast.success('Đã xóa bình luận.');
      loadComments(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa bình luận.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <MessageSquareText className="h-6 w-6 text-cinema-red" />
          Quản lý Bình luận ({meta.total || 0})
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Kiểm duyệt, ẩn hoặc xóa bình luận vi phạm quy định cộng đồng.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo nội dung bình luận, tên phim, người dùng..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 outline-none focus:border-cinema-red dark:text-slate-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hiển thị</option>
          <option value="0">Đã ẩn</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Chưa có bình luận nào.</p>
        ) : (
          <div className="divide-y divide-cinema-border">
            {comments.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.full_name || c.username}
                    </span>
                    <span className="text-slate-500">trên phim</span>
                    <span className="font-semibold text-cinema-red">{c.movie_name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === 1
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {c.status === 1 ? 'Hiển thị' : 'Đã ẩn'}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                    {c.content}
                  </p>
                  <p className="text-slate-500">
                    {formatDate(c.created_at, { withTime: true })} • {c.like_count || 0} lượt thích
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(c)}
                    className="inline-flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-card px-2.5 py-1.5 font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-500 dark:text-slate-200"
                  >
                    {c.status === 1 ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Ẩn
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Hiện
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-red-500 hover:text-red-500 dark:text-slate-200"
                    title="Xóa bình luận"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={(p) => loadComments(p)}
      />
    </div>
  );
}
