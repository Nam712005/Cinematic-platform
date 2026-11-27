import { Clock, Play, RotateCcw } from 'lucide-react';

export default function ResumeWatchModal({ progress, onResume, onRestart }) {
  if (!progress) return null;

  const percent = Math.min(100, Math.max(0, Number(progress.progress_percent || 0)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cinema-red/15 text-cinema-red">
          <Clock className="h-6 w-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tiếp tục xem?</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Bạn đã xem tập này đến mốc{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {progress.stopped_at_formatted}
          </span>{' '}
          / <span className="text-slate-500 dark:text-slate-400">{progress.duration_formatted}</span> (
          {Math.round(percent)}%). Bạn muốn phát tiếp từ vị trí đang xem dở hay xem lại từ đầu?
        </p>

        {/* Visual Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-cinema-card">
          <div
            className="h-full rounded-full bg-cinema-red transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cinema-red/25 transition-colors hover:bg-cinema-redHover"
          >
            <Play className="h-4 w-4 fill-white" />
            Tiếp tục xem
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Xem lại từ đầu
          </button>
        </div>
      </div>
    </div>
  );
}
