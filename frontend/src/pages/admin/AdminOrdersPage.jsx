import { CreditCard, Loader2, RotateCcw, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrencyVND, formatDate, getApiErrorMessage } from '../../utils/formatters.js';

export default function AdminOrdersPage() {
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Refund Modal
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const loadOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (debouncedQ) params.q = debouncedQ;
        if (statusFilter) params.status = statusFilter;
        const res = await adminApi.listTransactions(params);
        setOrders(res?.data || []);
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải danh sách giao dịch.'));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, statusFilter, toast]
  );

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const handleConfirmRefund = async (e) => {
    e.preventDefault();
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await adminApi.refundTransaction(
        refundTarget.payment_id || refundTarget.order_id || refundTarget.id,
        refundReason.trim() || 'Admin thực hiện hoàn tiền theo yêu cầu khách hàng'
      );
      toast.success(`Đã hoàn tiền đơn hàng ${refundTarget.order_code} và thu hồi gói tương ứng.`);
      setRefundTarget(null);
      setRefundReason('');
      loadOrders(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể thực hiện hoàn tiền cho đơn này.'));
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <CreditCard className="h-6 w-6 text-amber-500" />
          Quản lý Đơn hàng &amp; Hoàn tiền ({meta.total || 0})
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Tra cứu giao dịch nâng cấp Premium và xử lý hoàn tiền độc lập từng đơn hàng.
        </p>
      </div>

      {/* Filters (Auto-search debounced, no redundant Search button) */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã đơn hàng, mã giao dịch, email..."
            className="w-full rounded-xl border border-cinema-border bg-cinema-bg py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Xóa từ khóa"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="REFUNDED">Đã hoàn tiền</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Chưa có giao dịch nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cinema-border bg-cinema-card/70 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="px-4 py-3.5 font-bold">Mã đơn</th>
                  <th className="px-4 py-3.5 font-bold">Khách hàng</th>
                  <th className="px-4 py-3.5 font-bold">Gói &amp; Thời hạn</th>
                  <th className="px-4 py-3.5 font-bold">Số tiền</th>
                  <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border">
                {orders.map((ord) => {
                  const isRefunded = ord.order_status === 'REFUNDED';
                  const amount = ord.final_amount ?? ord.amount ?? ord.historical_price ?? 0;
                  const method = ord.payment_method || ord.provider || '—';
                  return (
                    <tr
                      key={ord.payment_id || ord.order_id || ord.order_code}
                      className="hover:bg-cinema-card/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {ord.order_code}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">{ord.transaction_no}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {ord.user_full_name || '—'}
                        </p>
                        <p className="text-slate-500">{ord.user_email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {ord.plan_name}
                        </p>
                        <p className="text-slate-500">
                          {formatDate(ord.start_date)} → {formatDate(ord.end_date)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          {formatCurrencyVND(amount)}
                        </p>
                        <p className="text-[11px] text-slate-500">{method}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isRefunded
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isRefunded ? 'Đã hoàn tiền' : 'Đã thanh toán'}
                        </span>
                        {isRefunded && ord.refund_reason && (
                          <p className="mt-1 max-w-[180px] truncate text-[11px] text-amber-600 dark:text-amber-400">
                            {ord.refund_reason}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        {!isRefunded ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRefundTarget(ord);
                              setRefundReason('');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Hoàn tiền
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {formatDate(ord.refunded_at)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(p) => loadOrders(p)} />

      {/* Refund Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hoàn tiền đơn hàng {refundTarget.order_code}
              </h3>
              <button type="button" onClick={() => setRefundTarget(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Số tiền hoàn:{' '}
              <strong>
                {formatCurrencyVND(
                  refundTarget.final_amount ?? refundTarget.amount ?? refundTarget.historical_price ?? 0
                )}
              </strong>
              . Thao tác này sẽ đánh dấu đơn hàng <strong>Đã hoàn tiền</strong>, loại khỏi doanh thu
              thống kê và chỉ thu hồi đúng gói đăng ký thuộc đơn này.
            </p>
            <form onSubmit={handleConfirmRefund} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold">Lý do hoàn tiền</label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Nhập lý do hoàn tiền..."
                  className="w-full rounded-xl border border-cinema-border bg-cinema-bg p-3 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                >
                  {refunding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xác nhận hoàn tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
