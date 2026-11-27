import { Film, RefreshCw, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext.jsx';

export default function MaintenancePage() {
  const { settings, maintenance, refreshSettings } = useSettings();
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await refreshSettings();
    } finally {
      setChecking(false);
    }
  };

  const siteName = settings.site.site_name || 'CINEMATIC';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cinema-bg px-4 py-12 text-center text-slate-900 transition-colors dark:text-slate-100">
      <div className="pointer-events-none absolute -top-32 h-96 w-96 rounded-full bg-cinema-red/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-cinema-border bg-cinema-surface p-8 shadow-2xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
          <Wrench className="h-8 w-8" />
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cinema-border bg-cinema-card px-3 py-1 text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300">
          <Film className="h-3.5 w-3.5 text-cinema-red" />
          {siteName}
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          Hệ thống đang bảo trì
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {maintenance.message ||
            'Hệ thống CINEMATIC đang bảo trì định kỳ để nâng cấp chất lượng dịch vụ. Vui lòng quay lại sau ít phút!'}
        </p>

        <div className="mt-7 flex items-center justify-center">
          <button
            type="button"
            onClick={handleRetry}
            disabled={checking}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-red px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cinema-redHover disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
          </button>
        </div>

        {settings.footer.footer_support_email && (
          <p className="mt-6 text-xs text-slate-500">
            Cần hỗ trợ gấp? Liên hệ{' '}
            <span className="text-slate-700 dark:text-slate-300">
              {settings.footer.footer_support_email}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
