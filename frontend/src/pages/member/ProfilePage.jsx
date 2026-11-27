import {
  Calendar,
  Camera,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Heart,
  History,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  formatDate,
  getApiErrorMessage,
  getApiFieldErrors,
  getInitials,
} from '../../utils/formatters.js';

export default function ProfilePage() {
  const { user, isPremium, refreshProfile, setUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dung lượng ảnh đại diện tối đa là 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await authApi.uploadAvatar(file);
      if (res?.data) {
        setUser(res.data);
      } else {
        await refreshProfile();
      }
      toast.success('Đã cập nhật ảnh đại diện thành công.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải lên ảnh đại diện.'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});

    const nextErrors = {};
    if (profileForm.full_name.trim().length < 2) {
      nextErrors.full_name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (!profileForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      nextErrors.email = 'Địa chỉ email không đúng định dạng.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authApi.updateMyProfile({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone_number: profileForm.phone_number.trim() || null,
      });
      if (res?.data) {
        setUser(res.data);
      }
      toast.success('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      const errors = getApiFieldErrors(err);
      if (Object.keys(errors).length > 0) setProfileErrors(errors);
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật thông tin tài khoản.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdErrors({});

    const nextErrors = {};
    if (!pwdForm.current_password) {
      nextErrors.current_password = 'Vui lòng nhập mật khẩu hiện tại.';
    }
    if (pwdForm.new_password.length < 6) {
      nextErrors.new_password = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    }
    if (pwdForm.confirm_password !== pwdForm.new_password) {
      nextErrors.confirm_password = 'Xác nhận mật khẩu mới không khớp.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setPwdErrors(nextErrors);
      return;
    }

    setSavingPwd(true);
    try {
      await authApi.changePassword({
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
        confirm_password: pwdForm.confirm_password,
      });
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Đổi mật khẩu thành công!');
    } catch (err) {
      const errors = getApiFieldErrors(err);
      if (Object.keys(errors).length > 0) setPwdErrors(errors);
      toast.error(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setSavingPwd(false);
    }
  };

  const activeSub = user?.active_subscription;
  const inputClass = (hasErr) =>
    `w-full rounded-xl border bg-cinema-bg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-cinema-red dark:text-white dark:placeholder-slate-500 ${
      hasErr ? 'border-red-500' : 'border-cinema-border'
    }`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Quản lý thông tin tài khoản, ảnh đại diện, gói thành viên và bảo mật mật khẩu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Account Summary Card */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-6 text-center shadow-sm dark:shadow-none">
            {/* Avatar + Upload Trigger */}
            <div className="relative mx-auto inline-block">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.full_name}
                  className="h-24 w-24 rounded-full border-2 border-cinema-border object-cover shadow-md"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-cinema-border bg-cinema-red text-2xl font-extrabold text-white shadow-md">
                  {getInitials(user?.full_name || user?.username)}
                </span>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                title="Đổi ảnh đại diện"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-cinema-border bg-cinema-surface text-slate-800 shadow-md transition-colors hover:border-cinema-red hover:text-cinema-red disabled:opacity-60 dark:text-white"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              {user?.full_name || user?.username}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              @{user?.username} {user?.uid_code ? `• ${user.uid_code}` : ''}
            </p>

            {/* Tier Status Card */}
            <div
              className={`mt-5 rounded-xl border p-4 text-left ${
                isPremium
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-cinema-border bg-cinema-card'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Gói hiện tại
                </span>
                {isPremium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-slate-950">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                ) : (
                  <span className="rounded-full border border-cinema-border bg-cinema-surface px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Miễn phí
                  </span>
                )}
              </div>

              {isPremium && activeSub ? (
                <div className="mt-2.5 space-y-1 text-xs">
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    {activeSub.plan_name || 'Gói thành viên Premium'}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    Hết hạn: <strong>{formatDate(activeSub.end_date, { withTime: true })}</strong>
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Nâng cấp lên Premium để mở khóa toàn bộ kho phim độc quyền chất lượng cao.
                </p>
              )}

              <Link
                to="/pricing"
                className={`mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-transform hover:scale-[1.01] ${
                  isPremium
                    ? 'border border-amber-500/50 bg-cinema-surface text-amber-600 hover:bg-amber-500/10 dark:text-amber-400'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                <Crown className="h-3.5 w-3.5" />
                {isPremium ? 'Gia hạn / Nâng cấp thêm' : 'Nâng cấp Premium ngay'}
              </Link>
            </div>

            {user?.created_at && (
              <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                Thành viên từ ngày {formatDate(user.created_at)}
              </p>
            )}
          </div>

          {/* Quick Member Shortcuts */}
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-3 shadow-sm dark:shadow-none">
            <nav className="space-y-1">
              <Link
                to="/history"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-cinema-card hover:text-cinema-red dark:text-slate-200 dark:hover:text-white"
              >
                <History className="h-4 w-4 text-cinema-red" />
                Lịch sử xem phim
              </Link>
              <Link
                to="/favorites"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-cinema-card hover:text-cinema-red dark:text-slate-200 dark:hover:text-white"
              >
                <Heart className="h-4 w-4 text-cinema-red" />
                Phim yêu thích
              </Link>
              <Link
                to="/transactions"
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-cinema-card hover:text-cinema-red dark:text-slate-200 dark:hover:text-white"
              >
                <Receipt className="h-4 w-4 text-amber-500" />
                Lịch sử giao dịch Premium
              </Link>
            </nav>
          </div>
        </aside>

        {/* Right Forms: Basic Info + Change Password */}
        <div className="space-y-6 lg:col-span-8">
          {/* Basic Profile Form */}
          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-sm dark:shadow-none">
            <div className="mb-5 flex items-center gap-2.5 border-b border-cinema-border pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-red/15 text-cinema-red">
                <User className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Thông tin tài khoản
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cập nhật họ tên, địa chỉ email và số điện thoại liên hệ của bạn.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile_full_name"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="profile_full_name"
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, full_name: e.target.value }));
                        if (profileErrors.full_name) {
                          setProfileErrors((p) => ({ ...p, full_name: '' }));
                        }
                      }}
                      placeholder="Nhập họ và tên"
                      className={inputClass(profileErrors.full_name)}
                    />
                  </div>
                  {profileErrors.full_name && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {profileErrors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="profile_phone"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="profile_phone"
                      type="text"
                      value={profileForm.phone_number}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, phone_number: e.target.value }));
                        if (profileErrors.phone_number) {
                          setProfileErrors((p) => ({ ...p, phone_number: '' }));
                        }
                      }}
                      placeholder="0901 234 567"
                      className={inputClass(profileErrors.phone_number)}
                    />
                  </div>
                  {profileErrors.phone_number && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {profileErrors.phone_number}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile_email"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profile_email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => {
                      setProfileForm((p) => ({ ...p, email: e.target.value }));
                      if (profileErrors.email) {
                        setProfileErrors((p) => ({ ...p, email: '' }));
                      }
                    }}
                    placeholder="name@example.com"
                    className={inputClass(profileErrors.email)}
                  />
                </div>
                {profileErrors.email && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {profileErrors.email}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cinema-red/25 transition-colors hover:bg-cinema-redHover disabled:opacity-60"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </section>

          {/* Integrated Change Password Section (UI29) */}
          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-sm dark:shadow-none">
            <div className="mb-5 flex items-center justify-between gap-2.5 border-b border-cinema-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bảo mật &amp; Đổi mật khẩu
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sử dụng mật khẩu mạnh từ 6 ký tự trở lên để bảo vệ tài khoản của bạn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-card px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showPwd ? 'Ẩn' : 'Hiện'}</span>
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="current_password"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="current_password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={pwdForm.current_password}
                    onChange={(e) => {
                      setPwdForm((p) => ({ ...p, current_password: e.target.value }));
                      if (pwdErrors.current_password) {
                        setPwdErrors((p) => ({ ...p, current_password: '' }));
                      }
                    }}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className={inputClass(pwdErrors.current_password)}
                  />
                </div>
                {pwdErrors.current_password && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {pwdErrors.current_password}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new_password"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="new_password"
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={pwdForm.new_password}
                      onChange={(e) => {
                        setPwdForm((p) => ({ ...p, new_password: e.target.value }));
                        if (pwdErrors.new_password) {
                          setPwdErrors((p) => ({ ...p, new_password: '' }));
                        }
                      }}
                      placeholder="Ít nhất 6 ký tự"
                      className={inputClass(pwdErrors.new_password)}
                    />
                  </div>
                  {pwdErrors.new_password && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {pwdErrors.new_password}
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
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirm_password"
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={pwdForm.confirm_password}
                      onChange={(e) => {
                        setPwdForm((p) => ({ ...p, confirm_password: e.target.value }));
                        if (pwdErrors.confirm_password) {
                          setPwdErrors((p) => ({ ...p, confirm_password: '' }));
                        }
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      className={inputClass(pwdErrors.confirm_password)}
                    />
                  </div>
                  {pwdErrors.confirm_password && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {pwdErrors.confirm_password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {user?.password_changed_at ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Đổi mật khẩu gần nhất: {formatDate(user.password_changed_at, { withTime: true })}
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  disabled={savingPwd}
                  className="inline-flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-cinema-red hover:text-cinema-red disabled:opacity-60 dark:text-white dark:hover:border-cinema-red dark:hover:text-cinema-red"
                >
                  {savingPwd ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
