import { Bot, CheckCircle2, Eye, EyeOff, Loader2, Save, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

export default function AdminChatbotPage() {
  const { refreshSettings } = useSettings();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState(null);
  const [showKeys, setShowKeys] = useState({ openai: false, gemini: false, groq: false });
  const [keyStatus, setKeyStatus] = useState({
    hasOpenAI: false,
    openaiMasked: '',
    hasGemini: false,
    geminiMasked: '',
    hasGroq: false,
    groqMasked: '',
  });

  const [form, setForm] = useState({
    is_enabled: true,
    active_provider: 'OPENAI',
    openai_model: 'gpt-4o-mini',
    openai_api_key: '',
    gemini_model: 'gemini-2.0-flash',
    gemini_api_key: '',
    groq_model: 'llama-3.3-70b-versatile',
    groq_api_key: '',
    display_name: 'CINEMATIC AI',
    greeting_message: '',
    system_prompt: '',
  });

  const applyConfigResponse = useCallback((c = {}) => {
    setForm({
      is_enabled: c.is_enabled !== undefined ? Boolean(c.is_enabled) : true,
      active_provider: c.active_provider || 'OPENAI',
      openai_model: c.openai_model || 'gpt-4o-mini',
      openai_api_key: '',
      gemini_model: c.gemini_model || 'gemini-2.0-flash',
      gemini_api_key: '',
      groq_model: c.groq_model || 'llama-3.3-70b-versatile',
      groq_api_key: '',
      display_name: c.display_name || 'CINEMATIC AI',
      greeting_message: c.greeting_message || '',
      system_prompt: c.system_prompt || '',
    });
    setKeyStatus({
      hasOpenAI: Boolean(c.has_openai_key ?? c.openai_key_configured),
      openaiMasked: c.openai_api_key_masked || '',
      hasGemini: Boolean(c.has_gemini_key ?? c.gemini_key_configured),
      geminiMasked: c.gemini_api_key_masked || '',
      hasGroq: Boolean(c.has_groq_key ?? c.groq_key_configured),
      groqMasked: c.groq_api_key_masked || '',
    });
  }, []);

  const loadChatbotData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const [cfgRes, statsRes] = await Promise.all([
          adminApi.getChatbotConfig(),
          adminApi.getChatbotStats().catch(() => ({ data: null })),
        ]);
        applyConfigResponse(cfgRes?.data || {});
        setStats(statsRes?.data || null);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Không thể tải cấu hình Chatbot AI.'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyConfigResponse, toast]
  );

  useEffect(() => {
    loadChatbotData();
  }, [loadChatbotData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        is_enabled: Boolean(form.is_enabled),
        active_provider: form.active_provider,
        openai_model: form.openai_model.trim() || 'gpt-4o-mini',
        gemini_model: form.gemini_model.trim() || 'gemini-2.0-flash',
        groq_model: form.groq_model.trim() || 'llama-3.3-70b-versatile',
        display_name: form.display_name.trim() || 'CINEMATIC AI',
        greeting_message: form.greeting_message.trim(),
        system_prompt: form.system_prompt.trim(),
      };
      if (form.openai_api_key.trim()) {
        payload.openai_api_key = form.openai_api_key.trim();
      }
      if (form.gemini_api_key.trim()) {
        payload.gemini_api_key = form.gemini_api_key.trim();
      }
      if (form.groq_api_key.trim()) {
        payload.groq_api_key = form.groq_api_key.trim();
      }

      const res = await adminApi.updateChatbotConfig(payload);
      if (res?.data) {
        applyConfigResponse(res.data);
      }
      await Promise.all([loadChatbotData({ silent: true }), refreshSettings()]);
      toast.success('Đã lưu cấu hình Chatbot AI (API key đã được mã hóa AES-256-GCM).');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể lưu cấu hình Chatbot AI.'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      let typedKey = form.openai_api_key.trim();
      let targetModel = form.openai_model.trim();
      if (form.active_provider === 'GEMINI') {
        typedKey = form.gemini_api_key.trim();
        targetModel = form.gemini_model.trim();
      } else if (form.active_provider === 'GROQ') {
        typedKey = form.groq_api_key.trim();
        targetModel = form.groq_model.trim();
      }

      const res = await adminApi.testChatbotConnection({
        provider: form.active_provider,
        ...(targetModel ? { model: targetModel } : {}),
        ...(typedKey ? { api_key: typedKey } : {}),
      });
      const latency = res?.data?.latency_ms ? ` (${res.data.latency_ms}ms)` : '';
      toast.success((res?.message || 'Kết nối tới nhà cung cấp AI thành công!') + latency);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Kiểm tra kết nối AI thất bại.'));
    } finally {
      setTesting(false);
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
  const keyInputCls =
    'w-full rounded-xl border border-cinema-border bg-cinema-bg py-2 pl-3 pr-10 text-sm text-slate-900 outline-none focus:border-cinema-red dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            <Bot className="h-6 w-6 text-cinema-red" />
            Quản lý Chatbot AI
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Hỗ trợ song song OpenAI, Google Gemini &amp; Groq (Llama 3) cho trợ lý hỏi đáp điện ảnh
            (API key được mã hóa bảo mật).
          </p>
        </div>

        <button
          type="button"
          disabled={testing}
          onClick={handleTestConnection}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-400"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Kiểm tra kết nối AI
        </button>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-4">
            <p className="text-xs text-slate-500">Tổng phiên hội thoại</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.total_sessions || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-4">
            <p className="text-xs text-slate-500">Tổng lượt phản hồi AI</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.total_api_calls || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-4">
            <p className="text-xs text-slate-500">Nhà cung cấp đang dùng</p>
            <p className="mt-1 text-xl font-extrabold text-amber-500">{form.active_provider}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-2xl border border-cinema-border bg-cinema-surface p-6 shadow-sm dark:shadow-none"
      >
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white">
          <input
            type="checkbox"
            checked={form.is_enabled}
            onChange={(e) => setForm((p) => ({ ...p, is_enabled: e.target.checked }))}
            className="h-4 w-4 rounded text-cinema-red"
          />
          Bật trợ lý hỏi đáp Chatbot AI trên giao diện người dùng
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">Nhà cung cấp AI chính</label>
            <select
              value={form.active_provider}
              onChange={(e) => setForm((p) => ({ ...p, active_provider: e.target.value }))}
              className={inputCls}
            >
              <option value="OPENAI">OpenAI (ChatGPT API)</option>
              <option value="GEMINI">Google Gemini API</option>
              <option value="GROQ">Groq (Llama 3 - Miễn phí, tốc độ cao)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Tên hiển thị trợ lý</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        {/* OpenAI */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">OpenAI Model</label>
            <input
              value={form.openai_model}
              onChange={(e) => setForm((p) => ({ ...p, openai_model: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span>OpenAI API Key</span>
              {keyStatus.hasOpenAI ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  (Đã cấu hình{keyStatus.openaiMasked ? `: ${keyStatus.openaiMasked}` : ''})
                </span>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  (Chưa cấu hình)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={form.openai_api_key}
                onChange={(e) => setForm((p) => ({ ...p, openai_api_key: e.target.value }))}
                placeholder={
                  keyStatus.hasOpenAI
                    ? 'Để trống nếu giữ nguyên key hiện tại...'
                    : 'Nhập OpenAI API key...'
                }
                className={keyInputCls}
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, openai: !p.openai }))}
                aria-label={showKeys.openai ? 'Ẩn OpenAI API key' : 'Hiện OpenAI API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Gemini */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">Gemini Model</label>
            <input
              value={form.gemini_model}
              onChange={(e) => setForm((p) => ({ ...p, gemini_model: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span>Gemini API Key</span>
              {keyStatus.hasGemini ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  (Đã cấu hình{keyStatus.geminiMasked ? `: ${keyStatus.geminiMasked}` : ''})
                </span>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  (Chưa cấu hình)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                value={form.gemini_api_key}
                onChange={(e) => setForm((p) => ({ ...p, gemini_api_key: e.target.value }))}
                placeholder={
                  keyStatus.hasGemini
                    ? 'Để trống nếu giữ nguyên key hiện tại...'
                    : 'Nhập Gemini API key...'
                }
                className={keyInputCls}
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, gemini: !p.gemini }))}
                aria-label={showKeys.gemini ? 'Ẩn Gemini API key' : 'Hiện Gemini API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Groq */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">Groq Model</label>
            <input
              value={form.groq_model}
              onChange={(e) => setForm((p) => ({ ...p, groq_model: e.target.value }))}
              placeholder="llama-3.3-70b-versatile"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span>Groq API Key</span>
              {keyStatus.hasGroq ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  (Đã cấu hình{keyStatus.groqMasked ? `: ${keyStatus.groqMasked}` : ''})
                </span>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  (Chưa cấu hình)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.groq ? 'text' : 'password'}
                value={form.groq_api_key}
                onChange={(e) => setForm((p) => ({ ...p, groq_api_key: e.target.value }))}
                placeholder={
                  keyStatus.hasGroq
                    ? 'Để trống nếu giữ nguyên key hiện tại...'
                    : 'Nhập Groq API key (gsk_...)...'
                }
                className={keyInputCls}
              />
              <button
                type="button"
                onClick={() => setShowKeys((p) => ({ ...p, groq: !p.groq }))}
                aria-label={showKeys.groq ? 'Ẩn Groq API key' : 'Hiện Groq API key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                {showKeys.groq ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Lời chào mở đầu</label>
          <textarea
            rows={2}
            value={form.greeting_message}
            onChange={(e) => setForm((p) => ({ ...p, greeting_message: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">System Prompt (Hướng dẫn hành vi)</label>
          <textarea
            rows={3}
            value={form.system_prompt}
            onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cinema-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Chế độ hỏi đáp thuần túy (bảo mật API key AES-256-GCM)
          </span>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cinema-red px-5 py-2.5 text-sm font-bold text-white hover:bg-cinema-redHover disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu cấu hình AI
          </button>
        </div>
      </form>
    </div>
  );
}
