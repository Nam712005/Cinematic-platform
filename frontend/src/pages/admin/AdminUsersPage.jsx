import {
  Crown,
  Edit3,
  Loader2,
  Lock,
  Plus,
  Search,
  Shield,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import Pagination from '../../components/common/Pagination.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDate, getApiErrorMessage } from '../../utils/formatters.js';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    phone_number: '',
    role_code: 'MEMBER',
    status: 1,
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (debouncedQ) params.q = debouncedQ;
        if (tierFilter) params.account_type = tierFilter;
        if (statusFilter !== '') params.status = statusFilter;
        const res = await adminApi.listUsers(params);
        setUsers(res?.data || []);
        setMeta(res?.meta || { page, totalPages: 1, total: 0 });
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải danh sách người dùng.'));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, tierFilter, statusFilter, toast]
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleToggleLock = async (u) => {
    const nextStatus = u.status === 1 ? 0 : 1;
    const actionLabel = nextStatus === 0 ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản "${u.email}"?`)) return;

    setTogglingId(u.id);
    try {
      await adminApi.updateUserStatus(u.id, nextStatus);
      toast.success(`Đã ${actionLabel} tài khoản "${u.email}".`);
      loadUsers(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Không thể ${actionLabel} tài khoản.`));
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone_number: form.phone_number.trim() || null,
          role_code: form.role_code,
          status: Number(form.status),
        };
        if (form.password.trim()) payload.new_password = form.password.trim();
        await adminApi.updateUser(editingUser.id, payload);
        toast.success('Đã cập nhật thông tin tài khoản.');
      } else {
        await adminApi.createUser({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          username: form.username.trim(),
          password: form.password,
          phone_number: form.phone_number.trim() || null,
          role_code: form.role_code,
          status: Number(form.status),
        });
        toast.success('Đã tạo tài khoản mới thành công.');
      }
      setModalOpen(false);
      loadUsers(meta.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu tài khoản.'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Users className="h-6 w-6 text-cinema-red" />
            Quản lý người dùng ({meta.total || 0})
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Theo dõi tài khoản Thường/Premium, phân quyền và khóa/mở khóa tài khoản tức thì.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setForm({
              full_name: '',
              email: '',
              username: '',
              password: '',
              phone_number: '',
              role_code: 'MEMBER',
              status: 1,
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cinema-red px-4 py-2 text-xs font-bold text-white hover:bg-cinema-redHover"
        >
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cinema-border bg-cinema-surface p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo họ tên, email, username..."
            className="w-full rounded-xl border border-cinema-border bg-cinema-bg py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white"
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

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 outline-none focus:border-cinema-red dark:text-slate-200"
        >
          <option value="">Tất cả gói tài khoản</option>
          <option value="PREMIUM">Thành viên Premium</option>
          <option value="STANDARD">Tài khoản Thường</option>
          <option value="ADMIN">Quản trị viên (Admin)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-800 outline-none focus:border-cinema-red dark:text-slate-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đã khóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-cinema-border bg-cinema-surface shadow-sm dark:shadow-none">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-cinema-red" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Không tìm thấy tài khoản nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cinema-border bg-cinema-card/70 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="px-4 py-3.5 font-bold">Người dùng</th>
                  <th className="px-4 py-3.5 font-bold">Vai trò</th>
                  <th className="px-4 py-3.5 font-bold">Gói Premium</th>
                  <th className="px-4 py-3.5 font-bold">Trạng thái</th>
                  <th className="px-4 py-3.5 font-bold">Ngày tạo</th>
                  <th className="px-4 py-3.5 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const roleCode = u.role_code || u.role;
                  return (
                    <tr key={u.id} className="hover:bg-cinema-card/40">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {u.full_name}{' '}
                          {isSelf && (
                            <span className="ml-1 rounded bg-cinema-red/15 px-1.5 py-0.5 text-[10px] text-cinema-red">
                              Bạn
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{u.username} • {u.email}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {roleCode === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cinema-red/15 px-2.5 py-0.5 text-[11px] font-bold text-cinema-red">
                            <Shield className="h-3 w-3" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="rounded-full border border-cinema-border bg-cinema-card px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            MEMBER
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {u.is_premium ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <Crown className="h-3 w-3" />
                              Premium
                            </span>
                            {u.premium_end_date && (
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Hết hạn: {formatDate(u.premium_end_date)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">Miễn phí</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.status === 1
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/15 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {u.status === 1 ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setForm({
                                full_name: u.full_name || '',
                                email: u.email || '',
                                username: u.username || '',
                                password: '',
                                phone_number: u.phone_number || '',
                                role_code: roleCode || 'MEMBER',
                                status: u.status ?? 1,
                              });
                              setModalOpen(true);
                            }}
                            title="Sửa tài khoản"
                            className="rounded-lg border border-cinema-border bg-cinema-card p-1.5 text-slate-700 hover:border-amber-500 hover:text-amber-500 dark:text-slate-200"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isSelf || togglingId === u.id}
                            onClick={() => handleToggleLock(u)}
                            title={u.status === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                              u.status === 1
                                ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
                            }`}
                          >
                            {u.status === 1 ? (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3.5 w-3.5" />
                                Mở khóa
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(p) => loadUsers(p)} />

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold">Họ và tên *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="mb-1 block text-xs font-semibold">Tên đăng nhập *</label>
                  <input
                    required
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  {editingUser ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Vai trò</label>
                  <select
                    value={form.role_code}
                    onChange={(e) => setForm((p) => ({ ...p, role_code: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Số điện thoại</label>
                  <input
                    value={form.phone_number}
                    onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
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
                  {saving ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
