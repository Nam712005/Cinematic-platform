import { Server } from 'lucide-react';

export default function ServerSelector({ sources = [], activeSourceId, onSelect }) {
  if (!sources.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
        <Server className="h-3.5 w-3.5 text-cinema-red" />
        Nguồn phát:
      </span>

      {sources.map((src) => {
        const isActive = src.id === activeSourceId;
        return (
          <button
            key={src.id}
            type="button"
            onClick={() => onSelect(src)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'border-cinema-red bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                : 'border-cinema-border bg-cinema-card text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:bg-cinema-surface dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white'
            }`}
          >
            <span>{src.source_name}</span>
            {src.quality && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  isActive
                    ? 'bg-black/25 text-white'
                    : 'bg-cinema-bg text-slate-600 dark:bg-cinema-card dark:text-slate-400'
                }`}
              >
                {src.quality}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
