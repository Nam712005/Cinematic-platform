import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import { getApiErrorMessage, getApiFieldErrors } from '../../utils/formatters.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const [form, setForm] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    const nextErrors = {};
    if (form.new_password.length < 6) {
      nextErrors.new_password = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    }
    if (form.confirm_password !== form.new_password) {
      nextErrors.confirm_password = 'Xác nhận mật khẩu mới không khớp.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({
        token,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      setSuccess(true);
    } catch (err) {
      const errors = getApiFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
      setServerError(
        getApiErrorMessage(
          err,
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="mb-1.5 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            Liên kết không hợp lệ
          </div>
          <p>
            Không tìm thấy mã xác thực đặt lại mật khẩu trong đường dẫn. Vui lòng mở đúng liên kết
            được gửi trong email hoặc gửi yêu cầu mới.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Quay lại đăng nhập
          </Link>
          <Link
            to="/forgot-password"
            className="rounded-xl bg-cinema-red px-4 py-2 text-sm font-semibold text-white hover:bg-cinema-redHover"
          >
            Yêu cầu liên kết mới
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="mb-1.5 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            Đặt lại mật khẩu thành công
          </div>
          <p>
            Mật khẩu mới của bạn đã được cập nhật và các phiên đăng nhập cũ đã được bảo mật thu hồi.
            Bạn có thể đăng nhập ngay bằng mật khẩu mới.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-cinema-red px-4 py-3 text-sm font-semibold text-white hover:bg-cinema-redHover"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu mới</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Nhập mật khẩu mới an toàn cho tài khoản CINEMATIC của bạn.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="new_password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="new_password"
              name="new_password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.new_password}
              onChange={handleChange}
              placeholder="Ít nhất 6 ký tự"
              className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.new_password ? 'border-red-500' : 'border-cinema-border'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.new_password && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.new_password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm_password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.confirm_password ? 'border-red-500' : 'border-cinema-border'
              }`}
            />
          </div>
          {fieldErrors.confirm_password && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.confirm_password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cinema-red/25 transition-colors hover:bg-cinema-redHover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang cập nhật mật khẩu...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Xác nhận đặt lại mật khẩu
            </>
          )}
        </button>
      </form>
    </div>
  );
}
