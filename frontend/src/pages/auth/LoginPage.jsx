import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage, getApiFieldErrors } from '../../utils/formatters.js';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    identifier: '',
    password: '',
    remember_me: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setFieldErrors({});

    const nextErrors = {};
    if (!form.identifier.trim()) {
      nextErrors.identifier = 'Vui lòng nhập email hoặc tên đăng nhập.';
    }
    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { user, redirectTo } = await login({
        identifier: form.identifier.trim(),
        password: form.password,
        remember_me: form.remember_me,
      });

      toast.success(`Chào mừng trở lại, ${user.full_name || user.username}!`);

      if (user.role === 'ADMIN') {
        navigate(redirectTo || '/admin/dashboard', { replace: true });
      } else {
        const fromPath = location.state?.from?.pathname;
        const safeFrom = fromPath && !fromPath.startsWith('/admin') ? fromPath : redirectTo || '/';
        navigate(safeFrom, { replace: true });
      }
    } catch (err) {
      const errors = getApiFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
      setServerError(getApiErrorMessage(err, 'Đăng nhập không thành công. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng nhập</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Nhập thông tin tài khoản CINEMATIC của bạn để tiếp tục.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="identifier"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Email hoặc Tên đăng nhập
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={form.identifier}
              onChange={handleChange}
              placeholder="name@example.com hoặc username"
              className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.identifier ? 'border-red-500' : 'border-cinema-border'
              }`}
            />
          </div>
          {fieldErrors.identifier && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.identifier}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.password ? 'border-red-500' : 'border-cinema-border'
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
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              name="remember_me"
              checked={form.remember_me}
              onChange={handleChange}
              className="h-4 w-4 rounded border-cinema-border bg-cinema-bg text-cinema-red focus:ring-cinema-red"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-cinema-red transition-colors hover:text-red-500"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cinema-red/25 transition-colors hover:bg-cinema-redHover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-cinema-border pt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-semibold text-slate-900 transition-colors hover:text-cinema-red dark:text-white"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
