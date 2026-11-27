import { Film } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Film,
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có nội dung nào phù hợp với yêu cầu của bạn.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cinema-border bg-cinema-surface/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cinema-card text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
