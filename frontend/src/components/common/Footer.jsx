import { Film, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext.jsx';

export default function Footer({ variant = 'compact' }) {
  const { settings } = useSettings();
  const { site, footer } = settings;

  if (variant === 'compact') {
    return (
      <footer className="border-t border-cinema-border bg-cinema-surface/90 py-6 text-sm text-slate-600 transition-colors dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Film className="h-4 w-4 text-cinema-red" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {site.site_name || 'CINEMATIC'}
            </span>
            <span>— {footer.footer_copyright}</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs">
            <Link to="/movies" className="transition-colors hover:text-cinema-red dark:hover:text-white">
              Kho phim
            </Link>
            <Link to="/pricing" className="transition-colors hover:text-cinema-red dark:hover:text-white">
              Gói Premium
            </Link>
            <Link
              to={footer.footer_terms_url || '/terms-of-service'}
              className="transition-colors hover:text-cinema-red dark:hover:text-white"
            >
              Điều khoản dịch vụ
            </Link>
            <Link
              to={footer.footer_privacy_url || '/privacy-policy'}
              className="transition-colors hover:text-cinema-red dark:hover:text-white"
            >
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-cinema-border bg-cinema-surface text-slate-600 transition-colors dark:text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-red text-white">
              <Film className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
              {site.site_name || 'CINEMATIC'}
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {site.site_description}
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Khám phá
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <Link to="/" className="transition-colors hover:text-cinema-red dark:hover:text-white">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link
                to="/movies?type=SINGLE"
                className="transition-colors hover:text-cinema-red dark:hover:text-white"
              >
                Phim lẻ đặc sắc
              </Link>
            </li>
            <li>
              <Link
                to="/movies?type=SERIES"
                className="transition-colors hover:text-cinema-red dark:hover:text-white"
              >
                Phim bộ mới nhất
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="transition-colors hover:text-cinema-red dark:hover:text-white"
              >
                Nâng cấp Premium
              </Link>
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Hỗ trợ &amp; Chính sách
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <Link
                to={footer.footer_terms_url || '/terms-of-service'}
                className="transition-colors hover:text-cinema-red dark:hover:text-white"
              >
                Điều khoản dịch vụ
              </Link>
            </li>
            <li>
              <Link
                to={footer.footer_privacy_url || '/privacy-policy'}
                className="transition-colors hover:text-cinema-red dark:hover:text-white"
              >
                Chính sách bảo mật
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                className="transition-colors hover:text-cinema-red dark:hover:text-white"
              >
                Đăng nhập thành viên
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Liên hệ
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cinema-red" />
              <span>{footer.footer_support_email || site.site_email}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cinema-red" />
              <span>{site.site_phone}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cinema-red" />
              <span>{footer.footer_address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cinema-border py-4 text-center text-xs text-slate-500">
        {footer.footer_copyright}
      </div>
    </footer>
  );
}
