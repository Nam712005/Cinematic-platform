import {
  BarChart3,
  Bell,
  Bot,
  Check,
  CheckCheck,
  CreditCard,
  Crown,
  ExternalLink,
  Film,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  PlaySquare,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/adminApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { formatDate, getInitials } from '../utils/formatters.js';

const ADMIN_NAV_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
    ],
  },
  {
    label: 'Nội dung & Phim',
    items: [
      { to: '/admin/movies', label: 'Quản lý phim', icon: Film },
      { to: '/admin/episodes', label: 'Tập phim & Nguồn phát', icon: PlaySquare },
      { to: '/admin/categories', label: 'Phân loại (Thể loại / QG)', icon: FolderTree },
    ],
  },
  {
    label: 'Kinh doanh & Tài khoản',
    items: [
      { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
      { to: '/admin/plans', label: 'Gói Premium', icon: Crown },
      { to: '/admin/orders', label: 'Đơn hàng & Hoàn tiền', icon: CreditCard },
    ],
  },
  {
    label: 'Cộng đồng & Hệ thống',
    items: [
      { to: '/admin/comments', label: 'Quản lý bình luận', icon: MessageSquareText },
      { to: '/admin/chatbot', label: 'Cấu hình Chatbot AI', icon: Bot },
      { to: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isNavItemActive = (to) => {
    const isMovieEpisodesRoute = /^\/admin\/movies\/\d+\/episodes/.test(pathname);
    if (to === '/admin/episodes') {
      return pathname.startsWith('/admin/episodes') || isMovieEpisodesRoute;
    }
    if (to === '/admin/movies') {
      return pathname.startsWith('/admin/movies') && !isMovieEpisodesRoute;
    }
    if (to === '/admin/categories') {
      return (
        pathname.startsWith('/admin/categories') ||
        pathname.startsWith('/admin/genres') ||
        pathname.startsWith('/admin/countries')
      );
    }
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const themeRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await adminApi.getNotifications({ limit: 10 });
      setNotifications(res?.data?.items || []);
      setUnreadCount(res?.data?.unread_count || 0);
    } catch {
      // Silent fallback
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      toast.error('Không thể cập nhật trạng thái thông báo.');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất khỏi hệ thống quản trị.');
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-cinema-border bg-cinema-surface text-slate-900 dark:text-slate-200">
      <div className="flex h-16 items-center justify-between border-b border-cinema-border px-5">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cinema-red text-white shadow-md shadow-cinema-red/30">
            <Film className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-extrabold tracking-wider text-slate-900 dark:text-white">
              CINEMATIC
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Admin Portal
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                        : 'text-slate-700 hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-cinema-border p-3">
        <Link
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-200 dark:hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Về trang người dùng
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 transition-colors dark:bg-[#09090D] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 shrink-0">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Right Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-cinema-border bg-cinema-surface/95 px-4 shadow-sm backdrop-blur-md sm:px-6 dark:shadow-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-cinema-border p-2 text-slate-700 hover:bg-cinema-card dark:text-slate-200 lg:hidden"
              aria-label="Mở menu quản trị"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-sm font-extrabold tracking-wide text-slate-900 dark:text-white sm:text-base">
              HỆ THỐNG QUẢN TRỊ CINEMATIC
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              to="/"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-xl border border-cinema-border bg-cinema-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-200 dark:hover:text-white sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Trang chủ
            </Link>

            {/* Notifications Bell */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) loadNotifications();
                }}
                className="relative inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-200"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden md:inline">Thông báo</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-cinema-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface shadow-2xl">
                  <div className="flex items-center justify-between border-b border-cinema-border px-4 py-3">
                    <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200">
                      Thông báo
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cinema-red hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 divide-y divide-cinema-border overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        Chưa có thông báo mới.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 ${
                            n.is_read ? '' : 'bg-cinema-red/5 dark:bg-cinema-red/10'
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                            {n.message}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {formatDate(n.created_at, { withTime: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Pill */}
            <div className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-2.5 py-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cinema-red text-xs font-bold text-white">
                {getInitials(user?.full_name || user?.username)}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-800 dark:text-slate-100 sm:inline">
                {user?.full_name || 'Admin'}
              </span>
            </div>

            {/* Theme Switcher (Far Right) */}
            <div ref={themeRef} className="relative">
              <button
                type="button"
                onClick={() => setThemeOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cinema-border bg-cinema-card text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:text-slate-200 dark:hover:border-amber-400 dark:hover:text-amber-400"
                title="Giao diện Sáng / Tối"
              >
                {theme === 'light' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {themeOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-xl border border-cinema-border bg-cinema-surface p-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      setThemeOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                      theme === 'light'
                        ? 'bg-cinema-red/10 text-cinema-red'
                        : 'text-slate-700 hover:bg-cinema-card dark:text-slate-200'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      Sáng
                    </span>
                    {theme === 'light' && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      setThemeOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                      theme === 'dark'
                        ? 'bg-cinema-red/15 text-cinema-red dark:text-white'
                        : 'text-slate-700 hover:bg-cinema-card dark:text-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Moon className="h-3.5 w-3.5 text-sky-400" />
                      Tối
                    </span>
                    {theme === 'dark' && <Check className="h-3.5 w-3.5 text-cinema-red" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Admin Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
