import {
  Check,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { premiumApi } from '../../api/premiumApi.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrencyVND, formatDate, getApiErrorMessage } from '../../utils/formatters.js';

const COMPARISON_ROWS = [
  { label: 'Xem toàn bộ kho phim Miễn phí (Phim lẻ & Phim bộ)', free: true, premium: true },
  { label: 'Mở khóa 100% kho phim gắn nhãn Premium độc quyền', free: false, premium: true },
  { label: 'Chất lượng hình ảnh tối ưu Full HD / 2K / 4K', free: false, premium: true },
  { label: 'Trải nghiệm xem phim liền mạch không quảng cáo', free: false, premium: true },
  { label: 'Lưu lịch sử xem, phim yêu thích & đánh giá sao', free: true, premium: true },
  { label: 'Trò chuyện không giới hạn cùng trợ lý CINEMATIC AI', free: true, premium: true },
  { label: 'Ưu tiên băng thông tốc độ cao & hỗ trợ nhanh', free: false, premium: true },
];

export default function PricingPage() {
  const { user, isAuthenticated, isPremium } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    premiumApi
      .listPlans()
      .then((res) => {
        if (active) setPlans(res?.data || []);
      })
      .catch((err) => {
        if (active) {
          toast.error(getApiErrorMessage(err, 'Không thể tải danh sách gói Premium.'));
          setPlans([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const handleSelectPlan = (planId) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để tiếp tục đăng ký gói Premium.');
      navigate('/login', { state: { from: { pathname: `/checkout/${planId}` } } });
      return;
    }
    navigate(`/checkout/${planId}`);
  };

  // Highlight the plan marked popular by Admin in database
  const highlightedPlanId = plans.find((p) => Boolean(p.is_popular))?.id || null;

  const activeSub = user?.active_subscription;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cinema-border bg-cinema-surface px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12 dark:shadow-none">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cinema-red/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Crown className="h-3.5 w-3.5" />
            CINEMATIC PREMIUM
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Nâng tầm trải nghiệm điện ảnh không giới hạn
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            Chọn gói thành viên phù hợp để mở khóa toàn bộ kho phim Premium sắc nét, kích hoạt tức
            thì qua cổng thanh toán QR nhanh chóng và bảo mật.
          </p>

          {isPremium && activeSub && (
            <div className="mx-auto mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Bạn đang sở hữu <strong>{activeSub.plan_name}</strong> (hết hạn{' '}
                <strong>{formatDate(activeSub.end_date)}</strong>). Đăng ký thêm sẽ tự động nối tiếp
                thời hạn!
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Crown}
          title="Chưa có gói Premium khả dụng"
          description="Hiện tại chưa có gói thành viên nào đang mở bán. Vui lòng quay lại sau."
        />
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isHighlighted = plan.id === highlightedPlanId;
            const price = Number(plan.price || 0);
            const originalPrice = Number(plan.original_price || 0);
            const discountPct =
              originalPrice > price
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : 0;
            const perMonth =
              plan.duration_days >= 30
                ? Math.round(price / Math.max(1, Math.round(plan.duration_days / 30)))
                : price;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
                  isHighlighted
                    ? 'border-amber-500 bg-cinema-surface shadow-xl shadow-amber-500/15 ring-1 ring-amber-500/40'
                    : 'border-cinema-border bg-cinema-surface shadow-sm hover:border-amber-500/60 dark:shadow-none'
                }`}
              >
                {isHighlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                    Tiết kiệm nhất • Phổ biến
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Crown className="h-4 w-4" />
                      {plan.duration_days} ngày
                    </span>
                    {discountPct > 0 && (
                      <span className="rounded-full bg-cinema-red/15 px-2.5 py-0.5 text-[11px] font-bold text-cinema-red">
                        Giảm {discountPct}%
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
                    {plan.name}
                  </h2>

                  {plan.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {plan.description}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="mt-5 border-y border-cinema-border py-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {formatCurrencyVND(price)}
                      </span>
                      {originalPrice > price && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatCurrencyVND(originalPrice)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Chỉ khoảng{' '}
                      <strong className="text-amber-600 dark:text-amber-400">
                        {formatCurrencyVND(perMonth)}
                      </strong>{' '}
                      / tháng
                    </p>
                  </div>

                  {/* Features list */}
                  <ul className="mt-5 space-y-2.5">
                    {(plan.features || []).map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-[1.01]'
                      : 'bg-cinema-red text-white shadow-md shadow-cinema-red/25 hover:bg-cinema-redHover'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  {isPremium ? 'Gia hạn với gói này' : 'Chọn gói này'}
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* Comparison Table: Free vs Premium */}
      <section className="overflow-hidden rounded-3xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
        <div className="border-b border-cinema-border px-6 py-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            So sánh quyền lợi Miễn phí &amp; Premium
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cinema-border bg-cinema-card/70 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <th className="px-6 py-3.5 font-bold">Quyền lợi</th>
                <th className="w-36 px-4 py-3.5 text-center font-bold">Miễn phí</th>
                <th className="w-36 px-4 py-3.5 text-center font-extrabold text-amber-600 dark:text-amber-400">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="transition-colors hover:bg-cinema-card/40">
                  <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                    {row.label}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {row.free ? (
                      <Check className="mx-auto h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-slate-400" />
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Check className="mx-auto h-5 w-5 text-amber-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cinema-border bg-cinema-card/40 px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
          <span>
            Bằng việc nâng cấp, bạn đồng ý với{' '}
            <Link to="/terms-of-service" className="font-semibold text-cinema-red hover:underline">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy-policy" className="font-semibold text-cinema-red hover:underline">
              Chính sách bảo mật
            </Link>
            .
          </span>
          {isAuthenticated && (
            <Link
              to="/transactions"
              className="font-semibold text-slate-800 hover:text-cinema-red dark:text-slate-200"
            >
              Xem lịch sử giao dịch của tôi →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
