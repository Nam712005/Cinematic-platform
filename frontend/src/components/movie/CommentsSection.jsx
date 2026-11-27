import {
  AlertTriangle,
  CornerDownRight,
  Eye,
  Loader2,
  MessageSquare,
  Send,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interactionsApi } from '../../api/interactionsApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDate, getApiErrorMessage, getInitials } from '../../utils/formatters.js';
import Pagination from '../common/Pagination.jsx';

function CommentItem({
  comment,
  currentUser,
  isAdmin,
  onLike,
  onReplySubmit,
  onDelete,
  isReply = false,
}) {
  const [revealedSpoil, setRevealedSpoil] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySpoil, setReplySpoil] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const canDelete = currentUser && (isAdmin || currentUser.id === comment.user_id);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      await onReplySubmit(comment.id, replyText.trim(), replySpoil);
      setReplyText('');
      setReplySpoil(false);
      setReplyOpen(false);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-cinema-border p-4 ${
        isReply ? 'bg-cinema-bg/60' : 'bg-cinema-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        {comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.full_name || comment.username}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cinema-card text-xs font-bold text-slate-700 dark:text-slate-200">
            {getInitials(comment.full_name || comment.username)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {comment.full_name || comment.username}
            </span>
            {comment.episode_title && !isReply && (
              <span className="rounded bg-cinema-card px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                {comment.episode_title}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {formatDate(comment.created_at, { withTime: true })}
            </span>
          </div>

          {comment.is_spoil && !revealedSpoil ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                Bình luận này có thể tiết lộ nội dung phim (Spoiler).
              </span>
              <button
                type="button"
                onClick={() => setRevealedSpoil(true)}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-700 hover:underline dark:text-amber-300"
              >
                <Eye className="h-3.5 w-3.5" />
                Xem nội dung
              </button>
            </div>
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => onLike(comment.id)}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                comment.is_liked
                  ? 'text-cinema-red'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${comment.is_liked ? 'fill-cinema-red' : ''}`} />
              <span>{comment.like_count || 0} Thích</span>
            </button>

            {!isReply && currentUser && (
              <button
                type="button"
                onClick={() => setReplyOpen((v) => !v)}
                className="inline-flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <CornerDownRight className="h-3.5 w-3.5" />
                Trả lời
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="inline-flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            )}
          </div>

          {/* Inline Reply Form */}
          {replyOpen && (
            <form onSubmit={handleReply} className="mt-3 space-y-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Trả lời ${comment.full_name || comment.username}...`}
                className="w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cinema-red dark:text-white dark:placeholder-slate-500"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={replySpoil}
                    onChange={(e) => setReplySpoil(e.target.checked)}
                    className="rounded border-cinema-border bg-cinema-bg text-cinema-red"
                  />
                  Chứa tiết lộ nội dung (Spoiler)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cinema-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-cinema-redHover disabled:opacity-50"
                  >
                    {submittingReply ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Gửi trả lời
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Nested Replies */}
          {Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2.5 border-l-2 border-cinema-border pl-3.5">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onLike={onLike}
                  onDelete={onDelete}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({ movieId, episodeId = null, title = 'Bình luận' }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const toast = useToast();

  const [comments, setComments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState('');
  const [isSpoil, setIsSpoil] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(
    async (page = 1) => {
      if (!movieId) return;
      setLoading(true);
      try {
        const params = { page, limit: 10, sort };
        if (episodeId) params.episode_id = episodeId;
        const res = await interactionsApi.listComments(movieId, params);
        setComments(res?.data || []);
        setMeta(res?.meta || { page: 1, totalPages: 1, total: 0 });
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    },
    [movieId, episodeId, sort]
  );

  useEffect(() => {
    loadComments(1);
  }, [loadComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await interactionsApi.createComment(movieId, {
        content: content.trim(),
        episode_id: episodeId || null,
        is_spoil: isSpoil,
      });
      setContent('');
      setIsSpoil(false);
      toast.success('Đã đăng bình luận của bạn.');
      loadComments(1);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể đăng bình luận.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId, replyContent, replySpoil) => {
    try {
      await interactionsApi.createComment(movieId, {
        content: replyContent,
        episode_id: episodeId || null,
        parent_id: parentId,
        is_spoil: replySpoil,
      });
      toast.success('Đã gửi phản hồi.');
      loadComments(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể gửi phản hồi.'));
    }
  };

  const handleLike = async (commentId) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thích bình luận.');
      return;
    }
    try {
      const res = await interactionsApi.toggleCommentLike(commentId);
      const { liked, like_count } = res.data;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, is_liked: liked, like_count };
          }
          if (Array.isArray(c.replies) && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, is_liked: liked, like_count } : r
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể thực hiện thao tác này.'));
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await interactionsApi.deleteComment(commentId);
      toast.success('Đã xóa bình luận.');
      loadComments(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa bình luận.'));
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <MessageSquare className="h-5 w-5 text-cinema-red" />
          <span>
            {title} ({meta.total || 0})
          </span>
        </h2>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-cinema-red dark:text-slate-200"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </div>

      {/* Composer */}
      {isAuthenticated ? (
        <form
          onSubmit={handleSubmitComment}
          className="rounded-2xl border border-cinema-border bg-cinema-surface p-4 shadow-sm dark:shadow-none"
        >
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
            className="w-full resize-none rounded-xl border border-cinema-border bg-cinema-bg p-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cinema-red dark:text-white dark:placeholder-slate-500"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={isSpoil}
                onChange={(e) => setIsSpoil(e.target.checked)}
                className="rounded border-cinema-border bg-cinema-bg text-cinema-red"
              />
              <span>Đánh dấu bình luận có tiết lộ nội dung (Spoiler)</span>
            </label>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cinema-redHover disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi bình luận
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinema-border bg-cinema-surface px-5 py-4 text-sm text-slate-700 dark:bg-cinema-surface/70 dark:text-slate-300">
          <span>Đăng nhập để tham gia bình luận và thảo luận cùng cộng đồng CINEMATIC.</span>
          <Link
            to="/login"
            className="rounded-xl bg-cinema-red px-4 py-2 text-xs font-semibold text-white hover:bg-cinema-redHover"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cinema-red" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cinema-border py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              isAdmin={isAdmin}
              onLike={handleLike}
              onReplySubmit={handleReplySubmit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={(nextPage) => loadComments(nextPage)}
      />
    </section>
  );
}
