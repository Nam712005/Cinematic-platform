import { ListVideo, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EpisodeGrid({
  movieSlug,
  episodes = [],
  activeEpisodeSlug = null,
  title = 'Danh sách tập phim',
}) {
  if (!episodes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-cinema-border bg-cinema-surface/50 px-5 py-6 text-center text-sm text-slate-400">
        Chưa có tập phim nào được cập nhật cho bộ phim này.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm dark:shadow-none">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <ListVideo className="h-5 w-5 text-cinema-red" />
          <span>
            {title} ({episodes.length} tập)
          </span>
        </h3>
      </div>

      <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
        {episodes.map((ep) => {
          const isActive = activeEpisodeSlug && ep.slug === activeEpisodeSlug;
          return (
            <Link
              key={ep.id}
              to={`/watch/${movieSlug}/${ep.slug}`}
              className={`inline-flex items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'border-cinema-red bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                  : 'border-cinema-border bg-cinema-card text-slate-700 hover:border-cinema-red hover:bg-cinema-red/5 hover:text-cinema-red dark:text-slate-200 dark:hover:border-cinema-red dark:hover:bg-cinema-red/15 dark:hover:text-white'
              }`}
              title={ep.title || `Tập ${ep.episode_number}`}
            >
              {isActive && <Play className="h-3 w-3 shrink-0 fill-white" />}
              <span className="truncate">{ep.title || `Tập ${ep.episode_number}`}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
