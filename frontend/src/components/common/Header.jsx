import {
  Check,
  ChevronDown,
  Crown,
  Film,
  Heart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Search,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { moviesApi } from '../../api/moviesApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getInitials } from '../../utils/formatters.js';

export default function Header() {
  const { user, isAuthenticated, isAdmin, isPremium, logout } = useAuth();
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [taxonomy, setTaxonomy] = useState({ genres: [], countries: [] });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const navRef = useRef(null);
  const userMenuRef = useRef(null);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    let active = true;
    moviesApi
      .getTaxonomyAll()
      .then((res) => {
        if (active && res?.data) {
          setTaxonomy({
            genres: res.data.genres || [],
            countries: res.data.countries || [],
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchKeyword.trim();
    if (q) {
      navigate(`/movies?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/movies');
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    toast.success('Bạn đã đăng xuất thành công.');
    navigate('/');
  };

  const siteName = settings.site.site_name || 'CINEMATIC';
  const siteLogo = settings.site.site_logo_url;

  return (
    <header className="sticky top-0 z-40 border-b border-cinema-border bg-white/95 shadow-sm backdrop-blur-md transition-colors dark:bg-[#09090D]/90 dark:shadow-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Unified 5-item Navigation */}
        <div className="flex min-w-0 items-center gap-4 xl:gap-6" ref={navRef}>
          <Link to="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cinema-red text-white shadow-lg shadow-cinema-red/30">
                <Film className="h-5 w-5" />
              </span>
            )}
            <span className="whitespace-nowrap text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
              {siteName}
            </span>
          </Link>

          {/* Desktop Nav: Trang chủ | Phim lẻ | Phim bộ | Thể loại | Quốc gia */}
          <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors xl:px-3 ${
                  isActive
                    ? 'font-semibold text-cinema-red dark:text-white'
                    : 'text-slate-600 hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`
              }
            >
              Trang chủ
            </NavLink>

            <NavLink
              to="/movies?type=SINGLE"
              className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white xl:px-3"
            >
              Phim lẻ
            </NavLink>

            <NavLink
              to="/movies?type=SERIES"
              className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white xl:px-3"
            >
              Phim bộ
            </NavLink>

            {/* Thể loại Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown((cur) => (cur === 'genres' ? null : 'genres'))}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white xl:px-3"
              >
                Thể loại
                <ChevronDown className="h-4 w-4 shrink-0" />
              </button>
              {openDropdown === 'genres' && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border border-cinema-border bg-cinema-surface p-3 shadow-2xl">
                  <div className="grid grid-cols-2 gap-1">
                    {taxonomy.genres.length === 0 ? (
                      <span className="col-span-2 px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                        Đang cập nhật thể loại...
                      </span>
                    ) : (
                      taxonomy.genres.map((genre) => (
                        <Link
                          key={genre.id}
                          to={`/movies?genre=${genre.slug}`}
                          onClick={() => setOpenDropdown(null)}
                          className="rounded-lg px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-cinema-card hover:text-cinema-red dark:text-slate-300 dark:hover:text-white"
                        >
                          {genre.name}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quốc gia Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdown((cur) => (cur === 'countries' ? null : 'countries'))}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white xl:px-3"
              >
                Quốc gia
                <ChevronDown className="h-4 w-4 shrink-0" />
              </button>
              {openDropdown === 'countries' && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-cinema-border bg-cinema-surface p-3 shadow-2xl">
                  <div className="grid grid-cols-2 gap-1">
                    {taxonomy.countries.length === 0 ? (
                      <span className="col-span-2 px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                        Đang cập nhật quốc gia...
                      </span>
                    ) : (
                      taxonomy.countries.map((country) => (
                        <Link
                          key={country.id}
                          to={`/movies?country=${country.slug}`}
                          onClick={() => setOpenDropdown(null)}
                          className="rounded-lg px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-cinema-card hover:text-cinema-red dark:text-slate-300 dark:hover:text-white"
                        >
                          {country.name}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Fixed-width Search + Premium CTA + Auth/User Menu + Theme Switcher (Far Right) */}
        <div className="flex shrink-0 items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative hidden shrink-0 md:block">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm tên phim..."
              className="w-40 rounded-full border border-cinema-border bg-slate-50 py-1.5 pl-9 pr-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors hover:border-[var(--cinema-border-hover)] focus:border-cinema-red dark:bg-cinema-surface dark:text-white xl:w-52"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </form>

          <Link
            to="/pricing"
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-950 shadow-md shadow-amber-500/20 transition-transform hover:scale-105 sm:inline-flex"
          >
            <Crown className="h-3.5 w-3.5 shrink-0" />
            <span>{isPremium ? 'Premium' : 'Nâng cấp'}</span>
          </Link>

          {!isAuthenticated ? (
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <Link
                to="/login"
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-cinema-card dark:hover:text-white"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="shrink-0 whitespace-nowrap rounded-lg bg-cinema-red px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-cinema-redHover"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-cinema-border bg-slate-50 py-1 pl-1.5 pr-3 transition-colors hover:border-[var(--cinema-border-hover)] dark:bg-cinema-surface"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.full_name}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cinema-red text-xs font-bold text-white">
                    {getInitials(user?.full_name || user?.username)}
                  </span>
                )}
                <span className="hidden max-w-[110px] truncate text-sm font-medium text-slate-800 dark:text-slate-100 sm:block">
                  {user?.full_name || user?.username}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-cinema-border bg-white shadow-2xl dark:bg-cinema-surface">
                  <div className="border-b border-cinema-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>
                    {isPremium && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <Crown className="h-3 w-3" /> Thành viên Premium
                      </span>
                    )}
                  </div>

                  <div className="p-1.5">
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-slate-100 dark:text-amber-400 dark:hover:bg-cinema-card"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Trang quản trị Admin
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-cinema-card dark:hover:text-white"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-cinema-card dark:hover:text-white"
                    >
                      <History className="h-4 w-4 text-slate-400" />
                      Lịch sử xem phim
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-cinema-card dark:hover:text-white"
                    >
                      <Heart className="h-4 w-4 text-slate-400" />
                      Phim yêu thích
                    </Link>
                    <Link
                      to="/transactions"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-cinema-card dark:hover:text-white"
                    >
                      <Receipt className="h-4 w-4 text-slate-400" />
                      Lịch sử giao dịch
                    </Link>
                  </div>

                  <div className="border-t border-cinema-border p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Switcher Button + Dropdown (Far Right) */}
          <div className="relative shrink-0" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen((v) => !v)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cinema-border bg-slate-100 text-slate-700 transition-colors hover:border-cinema-red hover:text-cinema-red dark:bg-cinema-surface dark:text-slate-200 dark:hover:border-amber-400 dark:hover:text-amber-400"
              aria-label="Chuyển chế độ giao diện Sáng / Tối"
              title="Giao diện Sáng / Tối"
            >
              {theme === 'light' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-xl border border-cinema-border bg-white p-1 shadow-2xl dark:bg-cinema-surface">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setThemeMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    theme === 'light'
                      ? 'bg-cinema-red/10 text-cinema-red'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-cinema-card'
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
                    setThemeMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-cinema-red/15 text-cinema-red dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-cinema-card'
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

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-cinema-card hover:text-slate-900 dark:text-slate-300 dark:hover:text-white lg:hidden"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-cinema-border bg-cinema-surface px-4 pb-5 pt-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm tên phim..."
              className="w-full rounded-xl border border-cinema-border bg-cinema-bg py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cinema-red dark:text-white"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </form>

          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-cinema-card dark:text-slate-200"
            >
              Trang chủ
            </Link>
            <Link
              to="/movies?type=SINGLE"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-cinema-card dark:text-slate-200"
            >
              Phim lẻ
            </Link>
            <Link
              to="/movies?type=SERIES"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-cinema-card dark:text-slate-200"
            >
              Phim bộ
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-cinema-card dark:text-slate-200"
            >
              Kho phim &amp; Bộ lọc
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-600 hover:bg-cinema-card dark:text-amber-400"
            >
              Gói thành viên Premium
            </Link>
          </div>

          {!isAuthenticated && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-cinema-border pt-4">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-cinema-border py-2 text-center text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-cinema-red py-2 text-center text-sm font-semibold text-white"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
