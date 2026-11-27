import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import { getApiErrorMessage, getApiFieldErrors } from '../../utils/formatters.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError('');
    setServerError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(trimmed);
      setSubmittedMessage(
        res?.message ||
          'Nếu địa chỉ email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi tới hộp thư của bạn.'
      );
    } catch (err) {
      const errors = getApiFieldErrors(err);
      if (errors.email) {
        setFieldError(errors.email);
      } else {
        setServerError(getApiErrorMessage(err, 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quên mật khẩu</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Nhập địa chỉ email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu tới hộp thư của
          bạn.
        </p>
      </div>

      {submittedMessage ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              Yêu cầu đã được tiếp nhận
            </div>
            <p>{submittedMessage}</p>
            <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-300/80">
              Vui lòng kiểm tra cả thư mục Hộp thư đến và Thư rác (Spam). Liên kết chỉ có hiệu lực
              trong thời gian giới hạn và sử dụng một lần.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSubmittedMessage('');
                setEmail('');
              }}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Gửi lại cho email khác
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cinema-redHover"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        <>
          {serverError && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Địa chỉ email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  placeholder="name@example.com"
                  className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                    fieldError ? 'border-red-500' : 'border-cinema-border'
                  }`}
                />
              </div>
              {fieldError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cinema-red/25 transition-colors hover:bg-cinema-redHover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi liên kết...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Gửi liên kết đặt lại mật khẩu
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-cinema-border pt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang đăng nhập
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
