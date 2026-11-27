import { Crown, Eye, Film, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  if (!movie) return null;

  const isPremium = movie.access_type === 'PREMIUM';
  const poster = movie.thumbnail_url || movie.poster_url || movie.banner_url;
  const ratingValue = Number(movie.rating_avg || 0);

  return (
    <Link
      to={`/movies/${movie.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface transition-all duration-300 hover:-translate-y-1 hover:border-cinema-red hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/50"
    >
      {/* Poster 2:3 */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-card">
        {poster ? (
          <img
            src={poster}
            alt={movie.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
            <Film className="h-10 w-10 opacity-40" />
            <span className="px-3 text-center text-xs">{movie.name}</span>
          </div>
        )}

        {/* Dark bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Top-left Access Badge */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          ) : (
            <span className="rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              Miễn phí
            </span>
          )}
        </div>

        {/* Top-right Quality */}
        {movie.quality && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-100 backdrop-blur-sm">
            {movie.quality}
          </span>
        )}

        {/* Bottom-left Episode Info & Rating */}
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className="truncate rounded bg-cinema-red/90 px-2 py-0.5 text-white">
            {movie.current_episode_info ||
              (movie.type === 'SINGLE' ? 'Full' : `${movie.total_episodes || '?'} tập`)}
          </span>
          {ratingValue > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-amber-400 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-amber-400" />
              {ratingValue.toFixed(1)}
            </span>
          )}
        </div>

        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cinema-red text-white shadow-xl shadow-cinema-red/40 transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5 fill-white" />
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors group-hover:text-cinema-red dark:text-white">
            {movie.name}
          </h3>
          {movie.origin_name && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {movie.origin_name}
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            {movie.release_year || '—'}
            {movie.type ? ` • ${movie.type === 'SINGLE' ? 'Phim lẻ' : 'Phim bộ'}` : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {Number(movie.view_count || 0).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>
    </Link>
  );
}
