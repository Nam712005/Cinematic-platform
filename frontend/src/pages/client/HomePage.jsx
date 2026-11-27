import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Film,
  Flame,
  Info,
  Play,
  Sparkles,
  Star,
  Tv,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interactionsApi } from '../../api/interactionsApi.js';
import { moviesApi } from '../../api/moviesApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import MovieCard from '../../components/common/MovieCard.jsx';
import { HeroSkeleton, MovieGridSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

function MovieSection({ title, icon: Icon, movies = [], viewAllTo }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cinema-red/15 text-cinema-red">
            <Icon className="h-4 w-4" />
          </span>
          <span>{title}</span>
        </h2>

        {viewAllTo && (
          <Link
            to={viewAllTo}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-cinema-red dark:text-slate-300 dark:hover:text-cinema-red sm:text-sm"
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {movies.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`Chưa có phim trong mục ${title}`}
          description="Kho phim đang được cập nhật liên tục. Bạn có thể khám phá thêm các mục khác hoặc quay lại sau."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const [homeData, setHomeData] = useState({
    featured: [],
    latest: [],
    single_movies: [],
    series_movies: [],
    most_viewed: [],
  });
  const [continueList, setContinueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    moviesApi
      .getHomeData()
      .then((res) => {
        if (active && res?.data) {
          setHomeData({
            featured: res.data.featured || [],
            latest: res.data.latest || [],
            single_movies: res.data.single_movies || [],
            series_movies: res.data.series_movies || [],
            most_viewed: res.data.most_viewed || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setContinueList([]);
      return undefined;
    }
    let active = true;
    interactionsApi
      .listWatchHistory({ page: 1, limit: 8 })
      .then((res) => {
        if (active && Array.isArray(res?.data)) {
          const watching = res.data.filter((item) => item.watch_status === 'WATCHING');
          setContinueList(watching.slice(0, 5));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const featuredSlides = homeData.featured;
  useEffect(() => {
    if (featuredSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featuredSlides.length]);

  const activeHero = featuredSlides[heroIndex] || featuredSlides[0] || null;
  const heroImage =
    activeHero?.banner_url || activeHero?.poster_url || activeHero?.thumbnail_url || '';

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Hero Spotlight 16:9 — Always theatrical dark backdrop with crisp white overlay text */}
      {loading ? (
        <HeroSkeleton />
      ) : activeHero ? (
        <section className="relative overflow-hidden rounded-3xl border border-cinema-border bg-slate-950 shadow-2xl">
          <div className="relative flex min-h-[430px] w-full items-center sm:min-h-[480px] lg:min-h-[520px]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={activeHero.name}
                className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
            )}

            {/* Layered cinematic dark gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090D] via-[#09090D]/80 to-[#09090D]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-[#09090D]/30 to-transparent" />

            {/* Hero Content with generous breathing room above bottom controls */}
            <div className="relative z-10 w-full px-6 pb-16 pt-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {activeHero.access_type === 'PREMIUM' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                      <Crown className="h-3.5 w-3.5" />
                      Premium
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Miễn phí
                    </span>
                  )}

                  {activeHero.quality && (
                    <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-slate-100 backdrop-blur-sm">
                      {activeHero.quality}
                    </span>
                  )}

                  {activeHero.release_year && (
                    <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                      {activeHero.release_year}
                    </span>
                  )}

                  {Number(activeHero.rating_avg || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-black/50 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      {Number(activeHero.rating_avg).toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h1 className="line-clamp-2 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {activeHero.name}
                  </h1>

                  {activeHero.origin_name && (
                    <p className="line-clamp-1 text-sm font-medium text-slate-300 sm:text-base">
                      {activeHero.origin_name}
                    </p>
                  )}
                </div>

                {Array.isArray(activeHero.genres) && activeHero.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeHero.genres.slice(0, 4).map((g) => (
                      <Link
                        key={g.id}
                        to={`/movies?genre=${g.slug}`}
                        className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs text-slate-200 backdrop-blur-sm transition-colors hover:border-cinema-red hover:bg-cinema-red/20"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                )}

                {activeHero.description && (
                  <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-slate-300">
                    {activeHero.description.replace(/<[^>]+>/g, '')}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Link
                    to={`/watch/${activeHero.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-6 py-3 text-sm font-bold text-white shadow-xl shadow-cinema-red/35 transition-transform hover:scale-[1.02] hover:bg-cinema-redHover"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    Xem ngay
                  </Link>
                  <Link
                    to={`/movies/${activeHero.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/50 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/10"
                  >
                    <Info className="h-4 w-4" />
                    Chi tiết phim
                  </Link>
                </div>
              </div>
            </div>

            {/* Slide Controls */}
            {featuredSlides.length > 1 && (
              <>
                <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setHeroIndex(
                        (prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-cinema-red hover:bg-cinema-red"
                    aria-label="Phim nổi bật trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroIndex((prev) => (prev + 1) % featuredSlides.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-cinema-red hover:bg-cinema-red"
                    aria-label="Phim nổi bật tiếp theo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                  {featuredSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === heroIndex ? 'w-7 bg-cinema-red' : 'w-2 bg-white/35 hover:bg-white/60'
                      }`}
                      aria-label={`Chọn slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-cinema-border bg-gradient-to-br from-cinema-card via-cinema-surface to-cinema-bg px-6 py-16 text-center shadow-2xl sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cinema-red/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cinema-border bg-cinema-bg/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              Trải nghiệm điện ảnh đỉnh cao
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Thế giới phim trực tuyến CINEMATIC
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              Khám phá kho phim lẻ, phim bộ đặc sắc chất lượng cao, đồng bộ lịch sử xem trên mọi
              thiết bị và trò chuyện cùng trợ lý hỏi đáp AI.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/movies"
                className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cinema-red/30 hover:bg-cinema-redHover"
              >
                <Film className="h-4 w-4" />
                Khám phá kho phim
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-300"
              >
                <Crown className="h-4 w-4" />
                Khám phá gói Premium
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Continue Watching Strip (Authenticated Members with Watch History) */}
      {isAuthenticated && continueList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </span>
              <span>Tiếp tục xem</span>
            </h2>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-cinema-red dark:text-slate-300 sm:text-sm"
            >
              Xem lịch sử
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {continueList.map((item) => {
              const stoppedSec = Number(item.stopped_at_seconds || 0);
              const durationSec = Number(item.duration_seconds || 0);
              const hasRealProgress = stoppedSec > 0 && durationSec > 0;
              const pct = hasRealProgress
                ? Math.min(100, Math.max(0, Number(item.progress_percent || 0)))
                : 0;
              const cardImg = item.banner_url || item.poster_url || item.thumbnail_url;

              return (
                <Link
                  key={item.id}
                  to={`/watch/${item.movie_slug}/${item.episode_slug}`}
                  className="group overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-cinema-red/60"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-cinema-card">
                    {cardImg ? (
                      <img
                        src={cardImg}
                        alt={item.movie_name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <Film className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cinema-red text-white shadow-lg">
                        <Play className="ml-0.5 h-4 w-4 fill-white" />
                      </span>
                    </div>
                    {hasRealProgress && pct > 0 && (
                      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60">
                        <div className="h-full bg-cinema-red" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-slate-900 group-hover:text-cinema-red dark:text-white">
                      {item.movie_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.episode_title || `Tập ${item.episode_number}`}
                      {hasRealProgress
                        ? ` • ${item.stopped_at_formatted} / ${item.duration_formatted}`
                        : ''}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4 Core Movie Rows */}
      {loading ? (
        <div className="space-y-10">
          <MovieGridSkeleton count={5} />
          <MovieGridSkeleton count={5} />
        </div>
      ) : (
        <div className="space-y-12">
          <MovieSection
            title="Mới cập nhật"
            icon={Sparkles}
            movies={homeData.latest}
            viewAllTo="/movies?sort=newest"
          />
          <MovieSection
            title="Phim lẻ mới"
            icon={Film}
            movies={homeData.single_movies}
            viewAllTo="/movies?type=SINGLE"
          />
          <MovieSection
            title="Phim bộ mới"
            icon={Tv}
            movies={homeData.series_movies}
            viewAllTo="/movies?type=SERIES"
          />
          <MovieSection
            title="Top xem nhiều"
            icon={Flame}
            movies={homeData.most_viewed}
            viewAllTo="/movies?sort=most_viewed"
          />
        </div>
      )}
    </div>
  );
}
