import { Crown, ExternalLink, Loader2, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { premiumApi } from '../../api/premiumApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrencyVND, formatDate, getApiErrorMessage } from '../../utils/formatters.js';

const FILTER_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Còn hạn' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

const METHOD_SHORT = {
  ZALOPAY: 'ZaloPay',
  MOMO: 'MoMo',
  BANK_TRANSFER: 'Chuyển khoản',
};

export default function TransactionsPage() {
  const toast = useToast();

  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(
    async (page = 1, activeFilter = filter) => {
      setLoading(true);
      try {
        const res = await premiumApi.listMyOrders({ filter: activeFilter, page, limit: 10 });
        setOrders(res?.data || []);
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải lịch sử giao dịch.'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [filter, toast]
  );

  useEffect(() => {
    loadOrders(1, filter);
  }, [filter, loadOrders]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Receipt className="h-5 w-5" />
            </span>
            Lịch sử giao dịch
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Theo dõi toàn bộ các đơn đăng ký gói Premium, thời hạn sử dụng và trạng thái thanh toán.
          </p>
        </div>

        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 shadow-md shadow-amber-500/20 transition-transform hover:scale-[1.02]"
        >
          <Crown className="h-4 w-4" />
          Đăng ký / Gia hạn Premium
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                  : 'border border-cinema-border bg-cinema-surface text-slate-700 hover:border-cinema-red hover:text-cinema-red dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Chưa có giao dịch nào"
          description={
            filter === 'all'
              ? 'Bạn chưa thực hiện giao dịch nâng cấp Premium nào. Khám phá bảng giá để mở khóa kho phim độc quyền.'
              : 'Không có giao dịch nào phù hợp với bộ lọc trạng thái hiện tại.'
          }
          action={
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-extrabold text-slate-950"
            >
              <Crown className="h-4 w-4" />
              Xem bảng giá Premium
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-cinema-border bg-cinema-card/70 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <th className="px-5 py-3.5 font-bold">Mã giao dịch</th>
                    <th className="px-5 py-3.5 font-bold">Gói dịch vụ</th>
                    <th className="px-5 py-3.5 font-bold">Số tiền</th>
                    <th className="px-5 py-3.5 font-bold">Phương thức</th>
                    <th className="px-5 py-3.5 font-bold">Trạng thái</th>
                    <th className="px-5 py-3.5 font-bold">Thời gian</th>
                    <th className="px-5 py-3.5 text-right font-bold">Biên lai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-border">
                  {orders.map((order) => {
                    const isRefunded = order.order_status === 'REFUNDED';
                    return (
                      <tr
                        key={order.order_id || order.order_code}
                        className="transition-colors hover:bg-cinema-card/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {order.order_code}
                          </p>
                          {order.transaction_no && (
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {order.transaction_no}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-amber-600 dark:text-amber-400">
                            {order.plan_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(order.start_date)} → {formatDate(order.end_date)}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                          {formatCurrencyVND(order.final_amount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {METHOD_SHORT[order.payment_method] || order.payment_method}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                isRefunded
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {order.payment_status_label ||
                                (isRefunded ? 'Đã hoàn tiền' : 'Đã thanh toán')}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Gói: {order.subscription_status_label || order.subscription_status}
                            </span>
                            {isRefunded && order.refund_reason && (
                              <span className="max-w-[200px] truncate text-[11px] text-amber-600 dark:text-amber-400">
                                {order.refund_reason}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(order.paid_at || order.created_at, { withTime: true })}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <Link
                            to={`/payment-result/${order.order_code}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-200 dark:hover:text-white"
                          >
                            Xem
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => {
              loadOrders(nextPage, filter);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
