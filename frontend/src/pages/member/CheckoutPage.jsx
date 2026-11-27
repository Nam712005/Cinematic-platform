import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { premiumApi } from '../../api/premiumApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  formatCurrencyVND,
  formatDate,
  formatDurationSeconds,
  getApiErrorMessage,
} from '../../utils/formatters.js';

const ALL_METHODS = [
  {
    id: 'ZALOPAY',
    label: 'ZaloPay QR',
    subtitle: 'Quét mã thanh toán qua ví ZaloPay',
    icon: Wallet,
    settingKey: 'payment_zalopay_enabled',
  },
  {
    id: 'MOMO',
    label: 'Ví MoMo QR',
    subtitle: 'Quét mã thanh toán qua ví MoMo',
    icon: Smartphone,
    settingKey: 'payment_momo_enabled',
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Chuyển khoản ngân hàng',
    subtitle: 'VietQR / Chuyển khoản nhanh 24/7',
    icon: Building2,
    settingKey: 'payment_bank_enabled',
  },
];

const QR_COUNTDOWN_SECONDS = 15 * 60; // 15 minutes

export default function CheckoutPage() {
  const { planId } = useParams();
  const { refreshProfile } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    let active = true;
    refreshSettings().finally(() => {
      if (active) setSettingsReady(true);
    });
    return () => {
      active = false;
    };
  }, [refreshSettings]);

  const enabledMethods = useMemo(() => {
    return ALL_METHODS.filter((m) => settings.payment?.[m.settingKey] !== false);
  }, [settings.payment]);

  const [paymentMethod, setPaymentMethod] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(QR_COUNTDOWN_SECONDS);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!settingsReady) return;
    if (enabledMethods.length === 0) {
      setPaymentMethod('');
      setPreview(null);
      setLoading(false);
      return;
    }
    if (!enabledMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(enabledMethods[0].id);
    }
  }, [settingsReady, enabledMethods, paymentMethod]);

  const loadPreview = useCallback(
    async (method) => {
      if (!method) return;
      const numericPlanId = Number.parseInt(planId, 10);
      if (!Number.isInteger(numericPlanId) || numericPlanId <= 0) {
        setErrorMsg('Mã gói Premium không hợp lệ.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg('');
      try {
        const res = await premiumApi.checkoutPreview({
          plan_id: numericPlanId,
          payment_method: method,
        });
        setPreview(res?.data || null);
        setSecondsLeft(QR_COUNTDOWN_SECONDS);
      } catch (err) {
        setPreview(null);
        setErrorMsg(getApiErrorMessage(err, 'Không thể khởi tạo thông tin thanh toán cho gói này.'));
      } finally {
        setLoading(false);
      }
    },
    [planId]
  );

  useEffect(() => {
    if (!settingsReady || !paymentMethod) return;
    if (!enabledMethods.some((m) => m.id === paymentMethod)) return;
    loadPreview(paymentMethod);
  }, [settingsReady, paymentMethod, enabledMethods, loadPreview]);

  // Countdown timer
  useEffect(() => {
    if (!preview || secondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [preview, secondsLeft]);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard
      ?.writeText(String(text))
      .then(() => toast.success(`Đã sao chép ${label}.`))
      .catch(() => {});
  };

  const handleConfirmMockPayment = async () => {
    if (!preview || confirming || secondsLeft <= 0) return;

    setConfirming(true);
    try {
      const res = await premiumApi.completeMockPayment({
        plan_id: preview.plan.id,
        payment_method: preview.payment_method,
        idempotency_key: preview.idempotency_key,
        qr_payload: preview.qr_payload,
      });

      // Immediately refresh AuthContext so Premium movies unlock without re-login!
      await refreshProfile();

      const orderCode = res?.data?.order_code;
      toast.success('Thanh toán thành công! Tài khoản Premium đã được kích hoạt.');
      if (orderCode) {
        navigate(`/payment-result/${orderCode}`, { replace: true });
      } else {
        navigate('/transactions', { replace: true });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể hoàn tất giao dịch. Vui lòng thử lại.'));
    } finally {
      setConfirming(false);
    }
  };

  if (settingsReady && enabledMethods.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={CreditCard}
          title="Cổng thanh toán đang tạm đóng"
          description="Hệ thống hiện đang tạm đóng các cổng thanh toán. Vui lòng quay lại sau!"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  setSettingsReady(false);
                  await refreshSettings();
                  setSettingsReady(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-cinema-red dark:text-slate-200"
              >
                <RefreshCw className="h-4 w-4" />
                Kiểm tra lại
              </button>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại bảng giá Premium
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (errorMsg && !loading && !preview) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={CreditCard}
          title="Không thể khởi tạo thanh toán"
          description={errorMsg}
          action={
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-cinema-redHover"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại bảng giá Premium
            </Link>
          }
        />
      </div>
    );
  }

  const isExpired = secondsLeft <= 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/pricing"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-cinema-red dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Chọn gói khác
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Thanh toán gói Premium
          </h1>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
          <ShieldCheck className="h-4 w-4" />
          Thanh toán QR bảo mật
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Payment Method Selector & QR Box */}
        <div className="space-y-6 lg:col-span-7">
          {/* Payment Methods */}
          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 shadow-sm dark:shadow-none">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Chọn phương thức thanh toán
            </h2>

            <div
              className={`grid gap-3 ${
                enabledMethods.length === 1
                  ? 'sm:grid-cols-1'
                  : enabledMethods.length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-3'
              }`}
            >
              {enabledMethods.map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={loading || confirming}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all ${
                      active
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40'
                        : 'border-cinema-border bg-cinema-card hover:border-amber-500/60'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        active ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {method.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {method.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* QR Code Payment Panel */}
          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-sm dark:shadow-none">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-cinema-border pb-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <QrCode className="h-4 w-4 text-cinema-red" />
                2. Quét mã QR hoặc chuyển khoản
              </h2>

              {preview && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    isExpired
                      ? 'bg-red-500/15 text-red-500'
                      : 'bg-cinema-card text-slate-800 dark:text-amber-400'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {isExpired ? 'Mã QR đã hết hạn' : `Còn lại ${formatDurationSeconds(secondsLeft)}`}
                </span>
              )}
            </div>

            {loading || !preview ? (
              <div className="flex flex-col items-center justify-center py-14">
                <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Đang tạo mã QR thanh toán...
                </p>
              </div>
            ) : (
              <div className="grid items-center gap-6 sm:grid-cols-12">
                {/* Crisp white QR Box (high-contrast scannable in both themes) */}
                <div className="flex flex-col items-center sm:col-span-5">
                  <div className="relative rounded-2xl border border-cinema-border bg-white p-4 shadow-md">
                    <QRCodeCanvas
                      value={preview.qr_payload}
                      size={184}
                      bgColor="#ffffff"
                      fgColor="#09090D"
                      level="M"
                    />
                    {isExpired && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/80 p-3 text-center">
                        <p className="text-xs font-bold text-white">Mã QR đã hết hạn</p>
                        <button
                          type="button"
                          onClick={() => loadPreview(paymentMethod)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-cinema-red px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Tạo mã mới
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    Mã tham chiếu:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {preview.reference_code}
                    </strong>
                  </p>
                </div>

                {/* Transfer / Payment Details */}
                <div className="space-y-3 text-sm sm:col-span-7">
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-cinema-border bg-cinema-card px-3.5 py-2.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Số tiền</span>
                    <span className="text-base font-extrabold text-cinema-red">
                      {formatCurrencyVND(preview.summary.final_amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl border border-cinema-border bg-cinema-card px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nội dung chuyển khoản
                      </p>
                      <p className="truncate font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {preview.bank_info?.transfer_content || `CINEMATIC ${preview.reference_code}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          preview.bank_info?.transfer_content ||
                            `CINEMATIC ${preview.reference_code}`,
                          'nội dung chuyển khoản'
                        )
                      }
                      className="rounded-lg border border-cinema-border bg-cinema-surface p-1.5 text-slate-600 hover:border-cinema-red hover:text-cinema-red dark:text-slate-300"
                      title="Sao chép"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {preview.bank_info && (
                    <div className="space-y-2 rounded-xl border border-cinema-border bg-cinema-card px-3.5 py-3 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-white">
                          {preview.bank_info.bank_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(preview.bank_info.account_no, 'số tài khoản')}
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-cinema-red dark:text-white"
                        >
                          {preview.bank_info.account_no}
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {preview.bank_info.account_name}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={confirming || isExpired}
                    onClick={handleConfirmMockPayment}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang kích hoạt Premium...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Xác nhận đã thanh toán
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right: Order Summary Card */}
        <aside className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-sm dark:shadow-none">
            <div className="mb-4 flex items-center gap-2 border-b border-cinema-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Tóm tắt đơn hàng
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kích hoạt tự động ngay sau khi xác nhận
                </p>
              </div>
            </div>

            {loading || !preview ? (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-cinema-card" />
                <div className="h-4 w-1/2 rounded bg-cinema-card" />
                <div className="h-10 w-full rounded bg-cinema-card" />
              </div>
            ) : (
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Tài khoản</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {preview.payer.full_name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                    {preview.payer.email}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Gói đăng ký</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {preview.summary.plan_name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Thời hạn</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {preview.summary.duration_days} ngày
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Hiệu lực dự kiến</span>
                  <span className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(preview.summary.estimated_start_date)} →{' '}
                    {formatDate(preview.summary.estimated_end_date)}
                  </span>
                </div>

                {preview.summary.is_chained_extension && (
                  <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                    Thời hạn mới sẽ được <strong>cộng nối tiếp</strong> vào ngày hết hạn của gói
                    Premium hiện tại của bạn.
                  </p>
                )}

                <div className="border-t border-cinema-border pt-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Tổng thanh toán</span>
                    <span className="text-2xl font-extrabold text-cinema-red">
                      {formatCurrencyVND(preview.summary.final_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
