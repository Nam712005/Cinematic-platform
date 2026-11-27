import {
  ArrowLeft,
  Calendar,
  Clock,
  Crown,
  Eye,
  Film,
  Globe,
  Heart,
  Loader2,
  Play,
  Star,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { interactionsApi } from '../../api/interactionsApi.js';
import { moviesApi } from '../../api/moviesApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import RatingStars from '../../components/common/RatingStars.jsx';
import { DetailSkeleton } from '../../components/common/Skeleton.jsx';
import CommentsSection from '../../components/movie/CommentsSection.jsx';
import EpisodeGrid from '../../components/player/EpisodeGrid.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

const STATUS_LABELS = {
  COMPLETED: 'Hoàn tất',
  ONGOING: 'Đang chiếu',
  UPCOMING: 'Sắp chiếu',
};

export default function MovieDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const loadMovie = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await moviesApi.getMovieDetail(slug);
      setMovie(res?.data || null);
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(getApiErrorMessage(err, 'Không thể tải thông tin bộ phim.'));
      }
    } finally {
      setLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    loadMovie();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadMovie]);

  const handleToggleFavorite = async () => {
    if (!movie || favoriteLoading) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm phim vào danh sách yêu thích.');
      navigate('/login');
      return;
    }
    setFavoriteLoading(true);
    try {
      if (movie.is_favorited) {
        await interactionsApi.removeFavorite(movie.id);
        setMovie((prev) => ({ ...prev, is_favorited: false }));
        toast.success('Đã bỏ khỏi danh sách yêu thích.');
      } else {
        await interactionsApi.addFavorite(movie.id);
        setMovie((prev) => ({ ...prev, is_favorited: true }));
        toast.success('Đã thêm vào danh sách phim yêu thích.');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái yêu thích.'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleLikeMovie = async () => {
    if (!movie || likeLoading) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thích bộ phim này.');
      return;
    }
    setLikeLoading(true);
    try {
      const res = await moviesApi.likeMovie(movie.id);
      setMovie((prev) => ({
        ...prev,
        like_count: res?.data?.like_count ?? (prev.like_count || 0) + 1,
      }));
      toast.success('Cảm ơn bạn đã yêu thích bộ phim!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể thực hiện thao tác này.'));
    } finally {
      setLikeLoading(false);
    }
  };

  // Instant 1-click 1–5 star rating (auto-saves immediately on star click)
  const handleInstantRate = async (score) => {
    if (!movie || ratingSubmitting) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đánh giá bộ phim.');
      navigate('/login');
      return;
    }

    setRatingSubmitting(true);
    try {
      const res = await interactionsApi.upsertRating(movie.id, { score });
      const updated = res?.data;
      setMovie((prev) => ({
        ...prev,
        rating_avg: updated?.movie_rating?.rating_avg ?? prev.rating_avg,
        rating_count: updated?.movie_rating?.rating_count ?? prev.rating_count,
        user_rating: {
          ...(prev.user_rating || {}),
          score,
        },
      }));
      toast.success(`Đã đánh giá ${score}/5 sao cho bộ phim.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể gửi đánh giá lúc này.'));
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (notFound || !movie) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          icon={Film}
          title="Không tìm thấy bộ phim này"
          description="Bộ phim bạn tìm kiếm có thể đã bị gỡ hoặc đường dẫn không còn tồn tại."
          action={
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại kho phim
            </Link>
          }
        />
      </div>
    );
  }

  const isPremium = movie.access_type === 'PREMIUM';
  const backdrop = movie.banner_url || movie.poster_url || movie.thumbnail_url;
  const poster = movie.thumbnail_url || movie.poster_url || movie.banner_url;
  const firstEpisode = Array.isArray(movie.episodes) && movie.episodes.length > 0 ? movie.episodes[0] : null;
  const watchHref = firstEpisode ? `/watch/${movie.slug}/${firstEpisode.slug}` : `/watch/${movie.slug}`;

  return (
    <div className="pb-14">
      {/* Cinematic Backdrop Banner */}
      <div className="relative overflow-hidden border-b border-cinema-border bg-cinema-surface">
        {backdrop && (
          <div className="pointer-events-none absolute inset-0">
            <img
              src={backdrop}
              alt=""
              className="h-full w-full scale-105 object-cover opacity-15 blur-xl dark:opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/85 to-cinema-bg/60" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Link
            to="/movies"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-cinema-red dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại kho phim
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-cinema-border bg-white p-6 shadow-sm sm:p-8 dark:bg-cinema-surface/95 dark:shadow-2xl">
            {/* Subtle ambient gradient glow at top-right corner */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-cinema-red/10 via-amber-400/10 to-transparent blur-3xl dark:from-cinema-red/15 dark:via-amber-500/10" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12">
              {/* Poster */}
              <div className="mx-auto w-56 shrink-0 sm:w-64 lg:col-span-3 lg:w-full">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-cinema-border bg-cinema-card shadow-lg dark:shadow-2xl">
                  {poster ? (
                    <img src={poster} alt={movie.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <Film className="h-12 w-12" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-xs font-extrabold uppercase text-slate-950 shadow-lg">
                        <Crown className="h-3.5 w-3.5" />
                        Premium
                      </span>
                    ) : (
                      <span className="rounded-lg bg-emerald-600/90 px-2.5 py-1 text-xs font-bold uppercase text-white">
                        Miễn phí
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata & Actions */}
              <div className="space-y-5 lg:col-span-9">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    {movie.name}
                  </h1>
                  {movie.origin_name && (
                    <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
                      {movie.origin_name}
                    </p>
                  )}
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                    <RatingStars
                      value={movie.rating_avg}
                      size="sm"
                      showValue
                      count={Number(movie.rating_count || 0)}
                    />
                  </div>

                  {movie.quality && (
                    <span className="rounded-xl border border-cinema-border bg-slate-50 px-3 py-1.5 font-bold text-slate-900 dark:bg-cinema-card dark:text-white">
                      {movie.quality}
                    </span>
                  )}
                  {movie.language && (
                    <span className="rounded-xl border border-cinema-border bg-slate-50 px-3 py-1.5 font-medium text-slate-700 dark:bg-cinema-card dark:text-slate-200">
                      {movie.language}
                    </span>
                  )}
                  {movie.release_year && (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-cinema-border bg-slate-50 px-3 py-1.5 text-slate-700 dark:bg-cinema-card dark:text-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {movie.release_year}
                    </span>
                  )}
                  {movie.duration_minutes && (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-cinema-border bg-slate-50 px-3 py-1.5 text-slate-700 dark:bg-cinema-card dark:text-slate-200">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {movie.duration_minutes} phút
                    </span>
                  )}
                  {movie.movie_status && (
                    <span className="rounded-xl border border-cinema-border bg-slate-50 px-3 py-1.5 text-slate-700 dark:bg-cinema-card dark:text-slate-200">
                      {STATUS_LABELS[movie.movie_status] || movie.movie_status}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-xl border border-cinema-border bg-slate-50 px-3 py-1.5 text-slate-600 dark:bg-cinema-card dark:text-slate-300">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    {Number(movie.view_count || 0).toLocaleString('vi-VN')} lượt xem
                  </span>
                </div>

                {/* Primary CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {firstEpisode ? (
                    <Link
                      to={watchHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cinema-red/30 transition-all hover:scale-[1.02] hover:bg-cinema-redHover"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      {isPremium && !movie.can_watch ? 'Xem phim (Premium)' : 'Xem phim ngay'}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    >
                      <Play className="h-4 w-4" />
                      Đang cập nhật tập phim
                    </button>
                  )}

                  {isPremium && !movie.can_watch && (
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Crown className="h-4 w-4" />
                      Nâng cấp Premium
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      movie.is_favorited
                        ? 'border-cinema-red bg-cinema-red/10 text-cinema-red'
                        : 'border-cinema-border bg-white text-slate-700 hover:border-cinema-red hover:bg-cinema-red/5 hover:text-cinema-red dark:bg-cinema-card dark:text-slate-200 dark:hover:border-cinema-red dark:hover:bg-cinema-red/15 dark:hover:text-cinema-red'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${movie.is_favorited ? 'fill-cinema-red' : ''}`} />
                    <span>{movie.is_favorited ? 'Đã yêu thích' : 'Yêu thích'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLikeMovie}
                    disabled={likeLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-cinema-red hover:bg-cinema-red/5 hover:text-cinema-red dark:bg-cinema-card dark:text-slate-200 dark:hover:border-cinema-red dark:hover:bg-cinema-red/15 dark:hover:text-cinema-red"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{Number(movie.like_count || 0).toLocaleString('vi-VN')}</span>
                  </button>
                </div>

                {/* Genres & Countries */}
                <div className="grid gap-3 border-t border-cinema-border pt-4 text-sm sm:grid-cols-2">
                  {Array.isArray(movie.genres) && movie.genres.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Thể loại:
                      </span>
                      {movie.genres.map((g) => (
                        <Link
                          key={g.id}
                          to={`/movies?genre=${g.slug}`}
                          className="rounded-lg border border-cinema-border bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-all hover:border-cinema-red hover:bg-cinema-red/5 hover:text-cinema-red dark:bg-cinema-card dark:text-slate-200 dark:hover:border-cinema-red dark:hover:bg-cinema-red/15 dark:hover:text-white"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {Array.isArray(movie.countries) && movie.countries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                        <Globe className="h-3.5 w-3.5" />
                        Quốc gia:
                      </span>
                      {movie.countries.map((c) => (
                        <Link
                          key={c.id}
                          to={`/movies?country=${c.slug}`}
                          className="rounded-lg border border-cinema-border bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-all hover:border-cinema-red hover:bg-cinema-red/5 hover:text-cinema-red dark:bg-cinema-card dark:text-slate-200 dark:hover:border-cinema-red dark:hover:bg-cinema-red/15 dark:hover:text-white"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                {movie.description && (
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Nội dung phim
                    </h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {movie.description.replace(/<[^>]+>/g, '')}
                    </p>
                  </div>
                )}

                {/* Directors & Cast */}
                {((movie.directors && movie.directors.length > 0) ||
                  (movie.actors && movie.actors.length > 0)) && (
                  <div className="grid gap-3 border-t border-cinema-border pt-4 text-xs sm:grid-cols-2">
                    {movie.directors?.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          Đạo diễn:{' '}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">
                          {movie.directors.map((d) => d.name).join(', ')}
                        </span>
                      </div>
                    )}
                    {movie.actors?.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div>
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Diễn viên:{' '}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">
                            {movie.actors.map((a) => a.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="mx-auto mt-8 max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Episodes Grid */}
        <EpisodeGrid movieSlug={movie.slug} episodes={movie.episodes || []} />

        {/* Streamlined 1-5 Star Rating Card (Instant click-to-rate, no extra input/submit button) */}
        <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm sm:p-6 dark:shadow-none">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
                <span className="text-2xl font-extrabold leading-none">
                  {Number(movie.rating_avg || 0).toFixed(1)}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-300">
                  / 5.0
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  Đánh giá bộ phim
                </h2>
                <RatingStars value={movie.rating_avg} size="sm" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {Number(movie.rating_count || 0)} lượt đánh giá từ thành viên
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {movie.user_rating
                        ? `Đánh giá của bạn: ${movie.user_rating.score}/5 sao (bấm sao để đổi)`
                        : 'Bấm chọn số sao để đánh giá ngay:'}
                    </span>
                    {ratingSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />}
                  </div>
                  <div className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2.5">
                    <RatingStars
                      value={movie.user_rating?.score || 0}
                      interactive
                      size="lg"
                      onChange={handleInstantRate}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Đăng nhập để chấm điểm 1–5 sao cho bộ phim này
                  </span>
                  <Link
                    to="/login"
                    className="rounded-xl bg-cinema-red px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-cinema-redHover"
                  >
                    Đăng nhập để đánh giá
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Comments Section */}
        <CommentsSection movieId={movie.id} title="Bình luận về phim" />
      </div>
    </div>
  );
}
