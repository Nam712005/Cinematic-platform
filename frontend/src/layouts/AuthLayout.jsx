import { ArrowLeft, Film } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext.jsx';

export default function AuthLayout() {
  const { settings } = useSettings();
  const siteName = settings.site.site_name || 'CINEMATIC';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cinema-bg px-4 py-10 text-slate-900 transition-colors dark:text-slate-100">
      {/* Subtle cinematic ambient glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cinema-red/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-cinema-surface hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        <div className="grid w-full overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-2xl md:grid-cols-12">
          {/* Left Brand Panel */}
          <div className="flex flex-col items-center justify-center border-b border-cinema-border bg-gradient-to-br from-cinema-card via-cinema-surface to-cinema-bg p-8 text-center md:col-span-5 md:border-b-0 md:border-r md:p-10">
            <Link
              to="/"
              className="group flex flex-col items-center gap-3 transition-transform hover:scale-[1.02]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cinema-red text-white shadow-xl shadow-cinema-red/30 transition-colors group-hover:bg-cinema-redHover">
                <Film className="h-8 w-8" />
              </span>
              <span className="text-2xl font-extrabold tracking-[0.18em] text-slate-900 dark:text-white">
                {siteName}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Kho phim trực tuyến chất lượng cao cùng trải nghiệm xem mượt mà và trợ lý hỏi đáp AI
              dành riêng cho thành viên.
            </p>
          </div>

          {/* Right Form Panel */}
          <div className="p-6 sm:p-10 md:col-span-7">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
