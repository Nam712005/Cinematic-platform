import { Edit3, FolderTree, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

const TAXONOMY_TABS = [
  { key: 'genres', label: 'Thể loại' },
  { key: 'countries', label: 'Quốc gia' },
  { key: 'categories', label: 'Danh mục' },
  { key: 'actors', label: 'Diễn viên' },
  { key: 'directors', label: 'Đạo diễn' },
];

export default function AdminTaxonomyPage({ defaultTab = 'genres' }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', code: '', description: '', status: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setActiveTab(defaultTab);
    setQ('');
    setDebouncedQ('');
  }, [defaultTab]);

  const filteredItems = useMemo(() => {
    if (!debouncedQ) return items;
    return items.filter((it) => {
      const haystack = `${it.name || ''} ${it.slug || ''} ${it.code || ''}`.toLowerCase();
      return haystack.includes(debouncedQ);
    });
  }, [items, debouncedQ]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listTaxonomy(activeTab, { page: 1, limit: 100 });
      setItems(res?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải danh sách phân loại.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      };
      if (activeTab === 'countries') {
        payload.code = form.code.trim().toUpperCase() || undefined;
      } else if (activeTab === 'genres' || activeTab === 'categories') {
        payload.description = form.description.trim() || null;
        payload.status = Number(form.status);
      }

      if (editingId) {
        await adminApi.updateTaxonomy(activeTab, editingId, payload);
        toast.success('Đã cập nhật thành công.');
      } else {
        await adminApi.createTaxonomy(activeTab, payload);
        toast.success('Đã thêm mới thành công.');
      }
      setModalOpen(false);
      loadItems();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu dữ liệu.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xác nhận xóa "${item.name}"?`)) return;
    try {
      await adminApi.deleteTaxonomy(activeTab, item.id);
      toast.success(`Đã xóa "${item.name}".`);
      loadItems();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa mục này.'));
    }
  };

  const activeLabel = TAXONOMY_TABS.find((t) => t.key === activeTab)?.label || '';
  const inputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <FolderTree className="h-6 w-6 text-cinema-red" />
            Quản lý Phân loại phim
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Thêm, chỉnh sửa và xóa Thể loại, Quốc gia, Danh mục, Diễn viên và Đạo diễn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', slug: '', code: '', description: '', status: 1 });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white hover:bg-cinema-redHover"
        >
          <Plus className="h-4 w-4" />
          Thêm {activeLabel}
        </button>
      </div>

      {/* Tabs + Debounced Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TAXONOMY_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setQ('');
                setDebouncedQ('');
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === t.key
                  ? 'bg-cinema-red text-white shadow-md shadow-cinema-red/25'
                  : 'border border-cinema-border bg-cinema-surface text-slate-700 hover:border-cinema-red dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full min-w-[220px] sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Tìm nhanh ${activeLabel.toLowerCase()}...`}
            className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Xóa từ khóa"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {debouncedQ ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cinema-border bg-cinema-card/70 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="px-5 py-3 font-bold">Tên {activeLabel}</th>
                  <th className="px-5 py-3 font-bold">Slug</th>
                  {activeTab === 'countries' && <th className="px-5 py-3 font-bold">Mã QG</th>}
                  <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-cinema-card/40">
                    <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.slug}</td>
                    {activeTab === 'countries' && (
                      <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.code || '—'}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setForm({
                              name: item.name || '',
                              slug: item.slug || '',
                              code: item.code || '',
                              description: item.description || '',
                              status: item.status ?? 1,
                            });
                            setModalOpen(true);
                          }}
                          className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-amber-500 hover:text-amber-500 dark:text-slate-200"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-red-500 hover:text-red-500 dark:text-slate-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? `Sửa ${activeLabel}` : `Thêm ${activeLabel} mới`}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold">Tên *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Slug (tự tạo nếu để trống)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {activeTab === 'countries' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold">Mã quốc gia (VD: VN, US)</label>
                  <input
                    maxLength={10}
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              )}
              {(activeTab === 'genres' || activeTab === 'categories') && (
                <div>
                  <label className="mb-1 block text-xs font-semibold">Mô tả</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              )}
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
                  className="rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white"
                >
                  {saving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
