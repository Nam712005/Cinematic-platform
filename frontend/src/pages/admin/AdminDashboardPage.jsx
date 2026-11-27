import {
  Activity,
  Crown,
  DollarSign,
  Eye,
  Film,
  Loader2,
  Receipt,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../../api/adminApi.js';
import { moviesApi } from '../../api/moviesApi.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrencyVND, formatDate, getApiErrorMessage } from '../../utils/formatters.js';

function buildLast6MonthsSeries(rawRows = [], valueKey = 'revenue') {
  const map = new Map();
  for (const row of rawRows) {
    if (row?.month_key) {
      map.set(row.month_key, Number(row[valueKey] || 0));
    }
  }

  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    result.push({
      month_key: key,
      label,
      [valueKey]: map.get(key) ?? 0,
    });
  }
  return result;
}

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const toast = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      adminApi.getDashboard(),
      adminApi.listTransactions({ page: 1, limit: 5 }).catch(() => ({ data: [] })),
      moviesApi.listMovies({ page: 1, limit: 5, sort: 'most_viewed' }).catch(() => ({ data: [] })),
    ])
      .then(([dashRes, ordersRes, moviesRes]) => {
        if (!active) return;
        setDashboard(dashRes?.data || null);
        setRecentOrders(ordersRes?.data || []);
        setTopMovies(moviesRes?.data || []);
      })
      .catch((err) => {
        if (active) toast.error(getApiErrorMessage(err, 'Không thể tải dữ liệu Dashboard.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const revenueChart = useMemo(
    () => buildLast6MonthsSeries(dashboard?.charts?.revenue_6_months || [], 'revenue'),
    [dashboard]
  );

  const viewsChart = useMemo(
    () => buildLast6MonthsSeries(dashboard?.charts?.views_6_months || [], 'watch_sessions'),
    [dashboard]
  );

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  const kpis = dashboard?.kpis || {};
  const activities = dashboard?.recent_activities || [];

  const axisColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)';
  const tooltipStyle = {
    backgroundColor: isDark ? '#12131A' : '#FFFFFF',
    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(15,23,42,0.2)',
    borderRadius: '12px',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
  };

  const kpiCards = [
    {
      label: 'Tổng số phim',
      value: Number(kpis.total_movies || 0).toLocaleString('vi-VN'),
      sub: `+${kpis.movies_this_month || 0} phim tháng này`,
      icon: Film,
      accent: 'bg-cinema-red/15 text-cinema-red',
    },
    {
      label: 'Tổng người dùng',
      value: Number(kpis.total_users || 0).toLocaleString('vi-VN'),
      sub: `+${kpis.users_this_month || 0} tài khoản mới`,
      icon: Users,
      accent: 'bg-sky-500/15 text-sky-500',
    },
    {
      label: 'Thành viên Premium',
      value: Number(kpis.premium_users || 0).toLocaleString('vi-VN'),
      sub: `Chiếm ${kpis.premium_ratio_percent || 0}% người dùng`,
      icon: Crown,
      accent: 'bg-amber-500/15 text-amber-500',
    },
    {
      label: 'Tổng doanh thu thực',
      value: formatCurrencyVND(kpis.total_revenue || 0),
      sub: `Tháng này: ${formatCurrencyVND(kpis.revenue_this_month || 0)}`,
      icon: DollarSign,
      accent: 'bg-emerald-500/15 text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Dashboard tổng quan
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Theo dõi nhanh tình hình kho phim, thành viên, doanh thu và hoạt động hệ thống.
          </p>
        </div>

        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-xs font-semibold text-white hover:bg-cinema-redHover"
        >
          <TrendingUp className="h-4 w-4" />
          Xem báo cáo chi tiết
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm dark:shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row (Always 6 full trailing months) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue 6 Months */}
        <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm dark:shadow-none">
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
            Doanh thu Premium (6 tháng gần nhất)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: 'rgba(148, 163, 184, 0.35)' }}
                  formatter={(val) => [formatCurrencyVND(val), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Watch Sessions 6 Months */}
        <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm dark:shadow-none">
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
            Lượt mở xem phim theo tháng (6 tháng gần nhất)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  formatter={(val) => [val, 'Phiên xem']}
                />
                <Bar
                  dataKey="watch_sessions"
                  fill="#E50914"
                  maxBarSize={44}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Bottom Tables: Recent Orders & Top Movies */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <section className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between border-b border-cinema-border px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Receipt className="h-4 w-4 text-amber-500" />
              Đơn hàng gần đây
            </h3>
            <Link to="/admin/orders" className="text-xs font-semibold text-cinema-red hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-cinema-border">
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">Chưa có đơn hàng nào.</p>
            ) : (
              recentOrders.map((ord) => {
                const orderAmount = ord.final_amount ?? ord.amount ?? ord.historical_price ?? 0;
                return (
                  <div
                    key={ord.payment_id || ord.order_id || ord.order_code}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">
                        {ord.order_code} • {ord.plan_name}
                      </p>
                      <p className="truncate text-slate-500 dark:text-slate-400">
                        {ord.user_email} •{' '}
                        {formatDate(ord.paid_at || ord.created_at, { withTime: true })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {formatCurrencyVND(orderAmount)}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ord.order_status === 'REFUNDED'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {ord.order_status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Đã thanh toán'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Top Viewed Movies */}
        <section className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between border-b border-cinema-border px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Eye className="h-4 w-4 text-cinema-red" />
              Top phim xem nhiều nhất
            </h3>
            <Link to="/admin/movies" className="text-xs font-semibold text-cinema-red hover:underline">
              Quản lý phim
            </Link>
          </div>
          <div className="divide-y divide-cinema-border">
            {topMovies.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">Chưa có phim nào.</p>
            ) : (
              topMovies.map((m, idx) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cinema-card font-bold text-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{m.name}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {m.type === 'SINGLE' ? 'Phim lẻ' : 'Phim bộ'} • {m.access_type}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {Number(m.view_count || 0).toLocaleString('vi-VN')} xem
                    </p>
                    <p className="inline-flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {Number(m.rating_avg || 0).toFixed(1)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity Logs */}
      {activities.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
          <div className="border-b border-cinema-border px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Activity className="h-4 w-4 text-cinema-red" />
              Nhật ký hoạt động gần đây
            </h3>
          </div>
          <div className="divide-y divide-cinema-border">
            {activities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {act.actor_label || 'Hệ thống'}
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">{act.description}</span>
                </div>
                <span className="text-slate-500">
                  {formatDate(act.created_at, { withTime: true })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
