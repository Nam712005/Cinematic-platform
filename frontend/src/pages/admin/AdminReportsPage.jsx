import { BarChart3, Crown, DollarSign, Film, Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../../api/adminApi.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrencyVND, getApiErrorMessage } from '../../utils/formatters.js';

const RANGES = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '6m', label: '6 tháng' },
  { value: '1y', label: '1 năm' },
];

export default function AdminReportsPage() {
  const { isDark } = useTheme();
  const toast = useToast();

  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi
      .getReports(range)
      .then((res) => {
        if (active) setData(res?.data || null);
      })
      .catch((err) => {
        if (active) toast.error(getApiErrorMessage(err, 'Không thể tải báo cáo thống kê.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, toast]);

  const axisColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)';
  const tooltipStyle = {
    backgroundColor: isDark ? '#12131A' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(15,23,42,0.2)',
    borderRadius: '12px',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
  };

  // Strictly match Backend dashboard.repository.js -> getReportsByRange() response schema
  const overview = data?.overview || {};
  const revenueSeries = data?.charts?.revenue_series || [];
  const usersSeries = data?.charts?.new_users_series || [];
  const planDist = data?.charts?.plan_distribution || [];
  const topMovies = data?.top_5_movies || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <BarChart3 className="h-6 w-6 text-cinema-red" />
            Báo cáo &amp; Thống kê
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Phân tích doanh thu thực (đã trừ đơn hoàn tiền), tăng trưởng người dùng và hiệu quả gói
            Premium.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                range === r.value
                  ? 'bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                  : 'border border-cinema-border bg-cinema-surface text-slate-700 hover:border-cinema-red dark:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[45vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Doanh thu kỳ</span>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrencyVND(overview.range_revenue || 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Đơn hoàn tiền: {overview.refunded_orders_count || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Đơn đã thanh toán
                </span>
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {overview.paid_orders_count || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">Trong {data?.range_days || 30} ngày qua</p>
            </div>

            <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Người dùng mới</span>
                <Users className="h-5 w-5 text-sky-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                +{overview.new_users_in_range || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">Tổng: {overview.total_users || 0}</p>
            </div>

            <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Tổng lượt xem</span>
                <Film className="h-5 w-5 text-cinema-red" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {Number(overview.total_views || 0).toLocaleString('vi-VN')}
              </p>
              <p className="mt-1 text-xs text-slate-500">Tổng phim: {overview.total_movies || 0}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                Biểu đồ doanh thu theo kỳ
              </h3>
              <div className="h-64">
                {revenueSeries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Chưa có doanh thu phát sinh trong kỳ này.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="period" stroke={axisColor} fontSize={11} />
                      <YAxis stroke={axisColor} fontSize={11} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                        formatter={(v) => [formatCurrencyVND(v), 'Doanh thu']}
                      />
                      <Bar dataKey="revenue" fill="#F59E0B" maxBarSize={44} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                Người dùng đăng ký mới
              </h3>
              <div className="h-64">
                {usersSeries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Chưa có tài khoản mới trong kỳ này.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usersSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="period" stroke={axisColor} fontSize={11} />
                      <YAxis stroke={axisColor} fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => [v, 'Người dùng mới']}
                      />
                      <Line
                        type="monotone"
                        dataKey="new_users"
                        stroke="#E50914"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface">
              <div className="border-b border-cinema-border px-5 py-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Phân bố doanh thu theo gói Premium
                </h3>
              </div>
              <div className="divide-y divide-cinema-border">
                {planDist.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">
                    Chưa có giao dịch gói Premium trong kỳ này.
                  </p>
                ) : (
                  planDist.map((p, idx) => (
                    <div key={p.plan_id || idx} className="flex items-center justify-between px-5 py-3.5 text-xs">
                      <div>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {p.plan_name}
                        </span>
                        <span className="ml-2 rounded-full bg-cinema-card px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {p.share_percent}%
                        </span>
                      </div>
                      <span className="text-slate-600 dark:text-slate-300">
                        {p.orders_count} đơn •{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {formatCurrencyVND(p.revenue)}
                        </strong>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface">
              <div className="border-b border-cinema-border px-5 py-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top phim nổi bật
                </h3>
              </div>
              <div className="divide-y divide-cinema-border">
                {topMovies.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">Chưa có dữ liệu phim.</p>
                ) : (
                  topMovies.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {m.rank || idx + 1}. {m.name}
                        </p>
                        {m.genres && (
                          <p className="truncate text-[11px] text-slate-500">{m.genres}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-300">
                        {Number(m.view_count || 0).toLocaleString('vi-VN')} lượt xem
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
