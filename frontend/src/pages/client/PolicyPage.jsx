import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext.jsx';

export default function PolicyPage({ type = 'terms' }) {
  const { settings } = useSettings();
  const isPrivacy = type === 'privacy';
  const siteName = settings.site.site_name || 'CINEMATIC';
  const supportEmail = settings.footer.footer_support_email || settings.site.site_email;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-cinema-red dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <article className="rounded-3xl border border-cinema-border bg-cinema-surface p-6 shadow-sm sm:p-10 dark:shadow-none">
        <div className="mb-6 flex items-center gap-3 border-b border-cinema-border pb-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cinema-red/15 text-cinema-red">
            {isPrivacy ? <Shield className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isPrivacy ? 'Chính sách bảo mật' : 'Điều khoản dịch vụ'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Áp dụng cho nền tảng xem phim trực tuyến {siteName}
            </p>
          </div>
        </div>

        {isPrivacy ? (
          <div className="space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Thông tin chúng tôi thu thập
              </h2>
              <p>
                Khi bạn đăng ký và sử dụng {siteName}, hệ thống chỉ lưu trữ các thông tin cần thiết
                bao gồm họ tên, tên đăng nhập, địa chỉ email, ảnh đại diện (nếu tải lên), lịch sử
                xem phim, danh sách yêu thích, đánh giá và lịch sử giao dịch gói Premium.
              </p>
            </section>
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. Bảo mật dữ liệu &amp; mật khẩu
              </h2>
              <p>
                Mật khẩu tài khoản được mã hóa một chiều bằng thuật toán chuẩn công nghiệp. Mọi
                phiên đăng nhập được bảo vệ bằng JWT và có thể thu hồi tức thì khi bạn đổi mật khẩu
                hoặc đăng xuất.
              </p>
            </section>
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Quyền kiểm soát dữ liệu của thành viên
              </h2>
              <p>
                Bạn có toàn quyền cập nhật thông tin hồ sơ, xóa từng mục hoặc xóa toàn bộ lịch sử
                xem, phim yêu thích và các phiên hội thoại Chatbot AI bất cứ lúc nào.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Phạm vi dịch vụ
              </h2>
              <p>
                {siteName} cung cấp nền tảng khám phá, xem phim trực tuyến và trợ lý hỏi đáp AI dành
                cho thành viên. Người dùng cần tuân thủ quy định sử dụng văn minh khi đăng bình luận
                và đánh giá phim.
              </p>
            </section>
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. Gói thành viên Premium &amp; Thanh toán
              </h2>
              <p>
                Các gói Premium kích hoạt quyền truy cập kho phim gắn nhãn Premium theo đúng thời
                hạn ngày đã chọn. Khi đăng ký thêm gói mới trong lúc còn hạn, thời hạn sẽ tự động
                cộng nối tiếp. Mọi giao dịch được lưu minh bạch trong mục Lịch sử giao dịch.
              </p>
            </section>
            <section className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Liên hệ hỗ trợ
              </h2>
              <p>
                Mọi thắc mắc về tài khoản hoặc giao dịch, vui lòng liên hệ đội ngũ hỗ trợ qua email{' '}
                <strong className="text-cinema-red">{supportEmail}</strong>.
              </p>
            </section>
          </div>
        )}
      </article>
    </div>
  );
}
