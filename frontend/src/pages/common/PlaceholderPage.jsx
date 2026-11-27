import { ArrowLeft, Film, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({
  title,
  description = 'Nội dung đang được hoàn thiện và sẽ sớm sẵn sàng phục vụ bạn.',
  variant = 'client',
}) {
  const isAdmin = variant === 'admin';

  if (isAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-cinema-red">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600">{description}</p>
            <Link
              to="/admin/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Về trang tổng quan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto flex min-h-[68vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cinema-red/15 text-cinema-red">
        <Film className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
        {description}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cinema-redHover"
        >
          Về trang chủ
        </Link>
        <Link
          to="/login"
          className="rounded-xl border border-cinema-border bg-cinema-surface px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
        >
          Đăng nhập thành viên
        </Link>
      </div>
    </section>
  );
}
