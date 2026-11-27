import { AtSign, Eye, EyeOff, Loader2, Lock, Mail, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage, getApiFieldErrors } from '../../utils/formatters.js';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
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
    setServerError('');
    setFieldErrors({});

    const nextErrors = {};
    if (form.full_name.trim().length < 2) {
      nextErrors.full_name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Địa chỉ email không đúng định dạng.';
    }
    const rawUsername = form.username;
    if (/\s/.test(rawUsername)) {
      nextErrors.username = 'Tên đăng nhập không được chứa khoảng trắng.';
    } else if (rawUsername.length < 3) {
      nextErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(rawUsername)) {
      nextErrors.username =
        'Tên đăng nhập viết liền không dấu, chỉ gồm chữ không dấu, số và dấu _, ., -.';
    }
    if (form.password.length < 6) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (form.confirm_password !== form.password) {
      nextErrors.confirm_password = 'Xác nhận mật khẩu không khớp.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
      });
      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login', { replace: true });
    } catch (err) {
      const errors = getApiFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
      setServerError(getApiErrorMessage(err, 'Không thể đăng ký tài khoản. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tạo tài khoản mới</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Trở thành thành viên CINEMATIC để lưu lịch sử xem, yêu thích phim và trò chuyện cùng AI.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <div>
          <label
            htmlFor="full_name"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Họ và tên
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                fieldErrors.full_name ? 'border-red-500' : 'border-cinema-border'
              }`}
            />
          </div>
          {fieldErrors.full_name && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.full_name}</p>
          )}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                  fieldErrors.email ? 'border-red-500' : 'border-cinema-border'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tên đăng nhập
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                value={form.username}
                onChange={handleChange}
                placeholder="nguyenvana"
                className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                  fieldErrors.username ? 'border-red-500' : 'border-cinema-border'
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.username}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
                className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
                  fieldErrors.password ? 'border-red-500' : 'border-cinema-border'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Xác nhận mật khẩu
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
                placeholder="Nhập lại mật khẩu"
                className={`w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
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
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cinema-red px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cinema-red/25 transition-colors hover:bg-cinema-redHover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Đăng ký tài khoản
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-cinema-border pt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          className="font-semibold text-slate-900 transition-colors hover:text-cinema-red dark:text-white"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
