import { AlertTriangle, Loader2, RotateCcw, Save, Settings, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

export default function AdminSettingsPage() {
  const { refreshSettings } = useSettings();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState({
    site: {
      site_name: 'CINEMATIC',
      site_email: 'cinematic.support@gmail.com',
      site_phone: '1900 1234',
      site_description: '',
    },
    operations: {
      movies_per_page: 12,
      comments_per_page: 10,
      maintenance_mode: false,
      maintenance_message: '',
    },
    payment: {
      payment_zalopay_enabled: true,
      payment_momo_enabled: true,
      payment_bank_enabled: true,
      payment_bank_name: '',
      payment_bank_account_no: '',
      payment_bank_account_name: '',
    },
    footer: {
      footer_copyright: '',
      footer_support_email: 'cinematic.support@gmail.com',
      footer_address: '',
    },
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      const d = res?.data || {};
      setForm({
        site: {
          site_name: d.site?.site_name || 'CINEMATIC',
          site_email: d.site?.site_email || 'cinematic.support@gmail.com',
          site_phone: d.site?.site_phone || '',
          site_description: d.site?.site_description || '',
        },
        operations: {
          movies_per_page: Number(d.operations?.movies_per_page) || 12,
          comments_per_page: Number(d.operations?.comments_per_page) || 10,
          maintenance_mode: Boolean(d.operations?.maintenance_mode),
          maintenance_message: d.operations?.maintenance_message || '',
        },
        payment: {
          payment_zalopay_enabled: d.payment?.payment_zalopay_enabled !== false,
          payment_momo_enabled: d.payment?.payment_momo_enabled !== false,
          payment_bank_enabled: d.payment?.payment_bank_enabled !== false,
          payment_bank_name: d.payment?.payment_bank_name || '',
          payment_bank_account_no: d.payment?.payment_bank_account_no || '',
          payment_bank_account_name: d.payment?.payment_bank_account_name || '',
        },
        footer: {
          footer_copyright: d.footer?.footer_copyright || '',
          footer_support_email: d.footer?.footer_support_email || 'cinematic.support@gmail.com',
          footer_address: d.footer?.footer_address || '',
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải cấu hình hệ thống.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings({
        site: form.site,
        operations: {
          movies_per_page: Number(form.operations.movies_per_page),
          comments_per_page: Number(form.operations.comments_per_page),
          maintenance_mode: Boolean(form.operations.maintenance_mode),
          maintenance_message: form.operations.maintenance_message,
        },
        payment: form.payment,
        footer: form.footer,
      });
      await refreshSettings();
      toast.success(
        form.operations.maintenance_mode
          ? 'Đã lưu cài đặt — CHẾ ĐỘ BẢO TRÌ ĐANG BẬT cho khách và thành viên!'
          : 'Đã lưu cài đặt hệ thống thành công.'
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu cài đặt hệ thống.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Khôi phục toàn bộ cấu hình hệ thống về giá trị mặc định?')) return;
    setResetting(true);
    try {
      await adminApi.resetSettings();
      await loadSettings();
      await refreshSettings();
      toast.success('Đã khôi phục cấu hình mặc định.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể khôi phục mặc định.'));
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
      </div>
    );
  }

  const inputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Settings className="h-6 w-6 text-cinema-red" />
            Cài đặt hệ thống
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Cấu hình thông tin website, bật/tắt chế độ bảo trì và các cổng thanh toán.
          </p>
        </div>

        <button
          type="button"
          disabled={resetting}
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-slate-700 hover:border-cinema-red hover:text-cinema-red dark:text-slate-200"
        >
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Khôi phục mặc định
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Maintenance Mode Highlight Box */}
        <section
          className={`rounded-2xl border p-5 ${
            form.operations.maintenance_mode
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-cinema-border bg-cinema-surface'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <Wrench className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Chế độ bảo trì hệ thống (Maintenance Mode)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Khi bật, toàn bộ khách và thành viên sẽ thấy trang Bảo trì; tài khoản Admin vẫn
                  truy cập bình thường.
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={form.operations.maintenance_mode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    operations: { ...p.operations, maintenance_mode: e.target.checked },
                  }))
                }
                className="h-4 w-4 rounded text-cinema-red"
              />
              <span>{form.operations.maintenance_mode ? 'ĐANG BẬT BẢO TRÌ' : 'Đang tắt'}</span>
            </label>
          </div>

          {form.operations.maintenance_mode && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Nhớ bấm &ldquo;Lưu toàn bộ cài đặt&rdquo; bên dưới để áp dụng ngay lập tức.
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold">Thông báo bảo trì hiển thị</label>
            <textarea
              rows={2}
              value={form.operations.maintenance_message}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  operations: { ...p.operations, maintenance_message: e.target.value },
                }))
              }
              className={inputCls}
            />
          </div>
        </section>

        {/* Site & Footer Settings */}
        <section className="space-y-4 rounded-2xl border border-cinema-border bg-cinema-surface p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Thông tin Website &amp; Chân trang
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Tên website</label>
              <input
                value={form.site.site_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, site: { ...p.site, site_name: e.target.value } }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email liên hệ</label>
              <input
                type="email"
                value={form.site.site_email}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    site: { ...p.site, site_email: e.target.value },
                    footer: { ...p.footer, footer_support_email: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Hotline</label>
              <input
                value={form.site.site_phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, site: { ...p.site, site_phone: e.target.value } }))
                }
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Mô tả website</label>
            <textarea
              rows={2}
              value={form.site.site_description}
              onChange={(e) =>
                setForm((p) => ({ ...p, site: { ...p.site, site_description: e.target.value } }))
              }
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Địa chỉ chân trang</label>
              <input
                value={form.footer.footer_address}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    footer: { ...p.footer, footer_address: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Bản quyền</label>
              <input
                value={form.footer.footer_copyright}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    footer: { ...p.footer, footer_copyright: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* Operations & Payment Methods */}
        <section className="space-y-4 rounded-2xl border border-cinema-border bg-cinema-surface p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Vận hành &amp; Phương thức thanh toán
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Số phim mỗi trang</label>
              <input
                type="number"
                min={4}
                max={60}
                value={form.operations.movies_per_page}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    operations: { ...p.operations, movies_per_page: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Số bình luận mỗi trang</label>
              <input
                type="number"
                min={5}
                max={50}
                value={form.operations.comments_per_page}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    operations: { ...p.operations, comments_per_page: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1 text-xs font-semibold">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.payment.payment_zalopay_enabled}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    payment: { ...p.payment, payment_zalopay_enabled: e.target.checked },
                  }))
                }
              />
              Bật ZaloPay QR
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.payment.payment_momo_enabled}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    payment: { ...p.payment, payment_momo_enabled: e.target.checked },
                  }))
                }
              />
              Bật Ví MoMo QR
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.payment.payment_bank_enabled}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    payment: { ...p.payment, payment_bank_enabled: e.target.checked },
                  }))
                }
              />
              Bật Chuyển khoản ngân hàng
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cinema-red/25 hover:bg-cinema-redHover disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu toàn bộ cài đặt
          </button>
        </div>
      </form>
    </div>
  );
}
