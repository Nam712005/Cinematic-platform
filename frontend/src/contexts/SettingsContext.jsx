import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsApi } from '../api/settingsApi.js';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  site: {
    site_name: 'CINEMATIC',
    site_email: 'cinematic.support@gmail.com',
    site_phone: '1900 1234',
    site_description:
      'CINEMATIC là nền tảng xem phim trực tuyến chất lượng cao tích hợp trợ lý hỏi đáp AI thông minh.',
    site_logo_url: '',
    site_favicon_url: '',
  },
  payment: {
    payment_zalopay_enabled: true,
    payment_momo_enabled: true,
    payment_bank_enabled: true,
  },
  operations: {
    movies_per_page: 12,
    comments_per_page: 10,
    maintenance_mode: false,
    maintenance_message:
      'Hệ thống CINEMATIC đang bảo trì định kỳ để nâng cấp chất lượng dịch vụ. Vui lòng quay lại sau ít phút!',
  },
  footer: {
    footer_copyright: '© 2026 CINEMATIC. Tất cả các quyền được bảo lưu.',
    footer_support_email: 'cinematic.support@gmail.com',
    footer_address: '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng, Việt Nam',
    footer_terms_url: '/terms-of-service',
    footer_privacy_url: '/privacy-policy',
  },
  chatbot: {
    chatbot_enabled: true,
    chatbot_display_name: 'CINEMATIC AI',
    chatbot_greeting:
      'Xin chào! Tôi là trợ lý hỏi đáp CINEMATIC AI. Tôi có thể giải đáp thông tin về phim, diễn viên, hướng dẫn xem phim và gói Premium.',
  },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: DEFAULT_SETTINGS.operations.maintenance_message,
  });

  const refreshSettings = useCallback(async () => {
    try {
      const res = await settingsApi.getPublicSettings();
      const data = res?.data;
      if (data) {
        setSettings((prev) => ({
          site: { ...prev.site, ...data.site },
          payment: { ...prev.payment, ...data.payment },
          operations: { ...prev.operations, ...data.operations },
          footer: { ...prev.footer, ...data.footer },
          chatbot: { ...prev.chatbot, ...data.chatbot },
        }));

        setMaintenance({
          enabled: Boolean(data.operations?.maintenance_mode),
          message:
            data.operations?.maintenance_message || DEFAULT_SETTINGS.operations.maintenance_message,
        });

        if (data.site?.site_name) {
          document.title = `${data.site.site_name} — Thế giới phim trực tuyến`;
        }
        if (data.site?.site_favicon_url) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.site.site_favicon_url;
        }
      }
    } catch {
      // Keep defaults gracefully if API temporarily unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    const handleMaintenanceEvent = (event) => {
      const detail = event.detail || {};
      setMaintenance({
        enabled: Boolean(detail.enabled),
        message: detail.message || DEFAULT_SETTINGS.operations.maintenance_message,
      });
    };

    window.addEventListener('cinematic:maintenance', handleMaintenanceEvent);
    return () => window.removeEventListener('cinematic:maintenance', handleMaintenanceEvent);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      maintenance,
      refreshSettings,
    }),
    [settings, loading, maintenance, refreshSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
