import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Crown,
  Film,
  Loader2,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { premiumApi } from '../../api/premiumApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatCurrencyVND, formatDate, getApiErrorMessage } from '../../utils/formatters.js';

const METHOD_LABELS = {
  ZALOPAY: 'Ví ZaloPay',
  MOMO: 'Ví MoMo',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

export default function PaymentResultPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    premiumApi
      .getOrderResult(orderCode)
      .then((res) => {
        if (active) setOrder(res?.data || null);
      })
      .catch((err) => {
        if (active) setErrorMsg(getApiErrorMessage(err, 'Không tìm thấy thông tin giao dịch này.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderCode]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Receipt}
          title="Không tìm thấy biên lai giao dịch"
          description={errorMsg}
          action={
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
            >
              <ArrowLeft className="h-4 w-4" />
              Về lịch sử giao dịch
            </Link>
          }
        />
      </div>
    );
  }

  const isRefunded = order.order_status === 'REFUNDED';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-cinema-border bg-cinema-surface shadow-xl">
        {/* Top Status Header */}
        <div
          className={`border-b border-cinema-border px-6 py-8 text-center ${
            isRefunded ? 'bg-amber-500/10' : 'bg-emerald-500/10'
          }`}
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
              isRefunded
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isRefunded ? <RotateCcw className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRefunded ? 'Giao dịch đã được hoàn tiền' : 'Kích hoạt Premium thành công!'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {isRefunded
              ? 'Đơn hàng này đã được quản trị viên xử lý hoàn tiền.'
              : 'Cảm ơn bạn đã nâng cấp. Toàn bộ kho phim Premium đã được mở khóa cho tài khoản của bạn.'}
          </p>
        </div>

        {/* Receipt Details */}
        <div className="space-y-3.5 p-6 text-sm sm:p-8">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Mã đơn hàng</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {order.order_code}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Mã giao dịch</span>
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              {order.transaction_no}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Gói thành viên</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <Crown className="h-4 w-4" />
              {order.plan_name} ({order.duration_days} ngày)
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Phương thức thanh toán</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {METHOD_LABELS[order.payment_method] || order.payment_method}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Thời gian thanh toán</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {formatDate(order.paid_at || order.created_at, { withTime: true })}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              Thời hạn gói
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {formatDate(order.start_date)} → {formatDate(order.end_date)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Trạng thái</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isRefunded
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {order.payment_status_label || (isRefunded ? 'Đã hoàn tiền' : 'Đã thanh toán')}
            </span>
          </div>

          {isRefunded && order.refund_reason && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <strong>Lý do hoàn tiền:</strong> {order.refund_reason}
            </div>
          )}

          <div className="border-t border-cinema-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Tổng số tiền</span>
              <span className="text-2xl font-extrabold text-cinema-red">
                {formatCurrencyVND(order.final_amount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            <Link
              to="/movies?access_type=PREMIUM"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-3 text-sm font-bold text-white shadow-md shadow-cinema-red/25 hover:bg-cinema-redHover"
            >
              <Film className="h-4 w-4" />
              Xem kho phim Premium
            </Link>
            <Link
              to="/transactions"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-200 dark:hover:text-white"
            >
              <Receipt className="h-4 w-4" />
              Lịch sử giao dịch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
