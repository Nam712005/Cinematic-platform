import { Check, Crown, Edit3, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatCurrencyVND, getApiErrorMessage } from '../../utils/formatters.js';

const EMPTY_PLAN = {
  code: '',
  name: '',
  duration_days: 30,
  price: 29000,
  original_price: '',
  description: '',
  features_text: '',
  status: 1,
  is_popular: false,
};

export default function AdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingPopularId, setSettingPopularId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listPlans();
      setPlans(res?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải danh sách gói Premium.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const features = form.features_text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        duration_days: Number(form.duration_days),
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        description: form.description.trim() || null,
        features,
        status: Number(form.status),
        is_popular: Boolean(form.is_popular),
      };

      if (editingId) {
        await adminApi.updatePlan(editingId, payload);
        toast.success('Đã cập nhật gói Premium (giá lịch sử đơn cũ vẫn được bảo toàn).');
      } else {
        await adminApi.createPlan(payload);
        toast.success('Đã tạo gói Premium mới.');
      }
      setModalOpen(false);
      loadPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu gói Premium.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      await adminApi.updatePlan(plan.id, {
        code: plan.code,
        name: plan.name,
        duration_days: Number(plan.duration_days),
        price: Number(plan.price),
        original_price: plan.original_price ? Number(plan.original_price) : null,
        description: plan.description || null,
        features: plan.features || [],
        status: plan.status === 1 ? 0 : 1,
        is_popular: Boolean(plan.is_popular),
      });
      toast.success(plan.status === 1 ? 'Đã tạm ẩn gói Premium.' : 'Đã mở bán lại gói Premium.');
      loadPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể đổi trạng thái gói.'));
    }
  };

  const handleSetPopular = async (plan) => {
    setSettingPopularId(plan.id);
    try {
      await adminApi.setPopularPlan(plan.id);
      toast.success(`Đã đặt "${plan.name}" làm gói Phổ biến nhất.`);
      loadPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể đặt gói phổ biến nhất.'));
    } finally {
      setSettingPopularId(null);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Xác nhận xóa gói "${plan.name}"?`)) return;
    try {
      await adminApi.deletePlan(plan.id);
      toast.success(`Đã xóa gói "${plan.name}".`);
      loadPlans();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa gói (có thể đã có đơn hàng phát sinh).'));
    }
  };

  const inputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Crown className="h-6 w-6 text-amber-500" />
            Quản lý Gói Premium ({plans.length})
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Cấu hình giá linh hoạt, thời hạn, quyền lợi và bật/tắt trạng thái kinh doanh từng gói.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_PLAN);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Thêm gói Premium
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-cinema-surface p-5 shadow-sm transition-colors dark:shadow-none ${
                plan.is_popular
                  ? 'border-amber-500 ring-1 ring-amber-500/40'
                  : 'border-cinema-border'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {plan.code} • {plan.duration_days} ngày
                  </span>
                  <div className="flex items-center gap-1.5">
                    {plan.is_popular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-950">
                        <Star className="h-3 w-3 fill-slate-950" />
                        Phổ biến nhất
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        plan.status === 1
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-500/15 text-slate-500'
                      }`}
                    >
                      {plan.status === 1 ? 'Đang bán' : 'Tạm ẩn'}
                    </span>
                  </div>
                </div>

                <h3 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-cinema-red">
                    {formatCurrencyVND(plan.price)}
                  </span>
                  {Number(plan.original_price || 0) > Number(plan.price) && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrencyVND(plan.original_price)}
                    </span>
                  )}
                </div>

                {plan.description && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </p>
                )}

                <ul className="mt-3 space-y-1.5 border-t border-cinema-border pt-3">
                  {(plan.features || []).map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-cinema-border pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(plan)}
                    className="rounded-lg border border-cinema-border bg-cinema-card px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-500 dark:text-slate-200"
                  >
                    {plan.status === 1 ? 'Tạm ẩn' : 'Mở bán'}
                  </button>
                  {!plan.is_popular && (
                    <button
                      type="button"
                      disabled={settingPopularId === plan.id}
                      onClick={() => handleSetPopular(plan)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-400"
                    >
                      {settingPopularId === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Star className="h-3 w-3" />
                      )}
                      Đặt phổ biến
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(plan.id);
                      setForm({
                        code: plan.code || '',
                        name: plan.name || '',
                        duration_days: plan.duration_days || 30,
                        price: plan.price || 0,
                        original_price: plan.original_price || '',
                        description: plan.description || '',
                        features_text: (plan.features || []).join('\n'),
                        status: plan.status ?? 1,
                        is_popular: Boolean(plan.is_popular),
                      });
                      setModalOpen(true);
                    }}
                    className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-amber-500 hover:text-amber-500 dark:text-slate-200"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan)}
                    className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-red-500 hover:text-red-500 dark:text-slate-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Chỉnh sửa gói Premium' : 'Tạo gói Premium mới'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Mã gói *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="PLAN_3M"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Thời hạn (ngày) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.duration_days}
                    onChange={(e) => setForm((p) => ({ ...p, duration_days: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Tên gói *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Giá gốc (tùy chọn)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.original_price}
                    onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Mô tả ngắn</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Danh sách quyền lợi (mỗi dòng 1 quyền lợi)
                </label>
                <textarea
                  rows={4}
                  value={form.features_text}
                  onChange={(e) => setForm((p) => ({ ...p, features_text: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_popular)}
                  onChange={(e) => setForm((p) => ({ ...p, is_popular: e.target.checked }))}
                />
                Đặt làm gói Phổ biến nhất (nổi bật trên trang Nâng cấp)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-cinema-border bg-cinema-card px-4 py-2 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400"
                >
                  {saving ? 'Đang lưu...' : 'Lưu gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
