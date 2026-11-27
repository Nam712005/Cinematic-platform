import { withTransaction } from '../../config/db.js';
import {
  findAdminSystemSettings,
  findMaintenanceSettings,
  findPublicSettings,
  upsertSetting,
} from './settings.repository.js';

const MAINTENANCE_CACHE_TTL_MS = 15_000;
let maintenanceCache = null;

const DEFAULT_SYSTEM_SETTINGS = [
  // SITE
  { group: 'SITE', key: 'site_name', value: 'CINEMATIC', valueType: 'STRING' },
  { group: 'SITE', key: 'site_email', value: 'cinematic.support@gmail.com', valueType: 'STRING' },
  { group: 'SITE', key: 'site_phone', value: '1900 1234', valueType: 'STRING' },
  {
    group: 'SITE',
    key: 'site_description',
    value: 'CINEMATIC là nền tảng xem phim trực tuyến chất lượng cao tích hợp trợ lý hỏi đáp AI thông minh.',
    valueType: 'STRING',
  },
  { group: 'SITE', key: 'site_logo_url', value: '', valueType: 'STRING' },
  { group: 'SITE', key: 'site_favicon_url', value: '', valueType: 'STRING' },
  // PAYMENT
  { group: 'PAYMENT', key: 'payment_zalopay_enabled', value: 'true', valueType: 'BOOLEAN' },
  { group: 'PAYMENT', key: 'payment_momo_enabled', value: 'true', valueType: 'BOOLEAN' },
  { group: 'PAYMENT', key: 'payment_bank_enabled', value: 'true', valueType: 'BOOLEAN' },
  { group: 'PAYMENT', key: 'payment_bank_name', value: 'Ngân hàng TMCP Quân đội (MBBank)', valueType: 'STRING' },
  { group: 'PAYMENT', key: 'payment_bank_account_no', value: '090123456789', valueType: 'STRING' },
  { group: 'PAYMENT', key: 'payment_bank_account_name', value: 'CINEMATIC MEDIA', valueType: 'STRING' },
  { group: 'PAYMENT', key: 'payment_bank_syntax', value: 'CINEMATIC [MA_DON_HANG]', valueType: 'STRING' },
  // OPERATIONS
  { group: 'OPERATIONS', key: 'movies_per_page', value: '12', valueType: 'NUMBER' },
  { group: 'OPERATIONS', key: 'comments_per_page', value: '10', valueType: 'NUMBER' },
  { group: 'OPERATIONS', key: 'admin_episodes_per_page', value: '10', valueType: 'NUMBER' },
  { group: 'OPERATIONS', key: 'maintenance_mode', value: 'false', valueType: 'BOOLEAN' },
  {
    group: 'OPERATIONS',
    key: 'maintenance_message',
    value: 'Hệ thống CINEMATIC đang bảo trì định kỳ để nâng cấp chất lượng dịch vụ. Vui lòng quay lại sau ít phút!',
    valueType: 'STRING',
  },
  // FOOTER
  { group: 'FOOTER', key: 'footer_copyright', value: '© 2026 CINEMATIC. Tất cả các quyền được bảo lưu.', valueType: 'STRING' },
  { group: 'FOOTER', key: 'footer_support_email', value: 'cinematic.support@gmail.com', valueType: 'STRING' },
  { group: 'FOOTER', key: 'footer_address', value: '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng, Việt Nam', valueType: 'STRING' },
  { group: 'FOOTER', key: 'footer_terms_url', value: '/terms-of-service', valueType: 'STRING' },
  { group: 'FOOTER', key: 'footer_privacy_url', value: '/privacy-policy', valueType: 'STRING' },
];

function castSettingValue(rawValue, valueType) {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  switch (valueType) {
    case 'BOOLEAN':
      return String(rawValue).toLowerCase() === 'true' || rawValue === '1';
    case 'NUMBER': {
      const parsed = Number(rawValue);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    case 'JSON':
      try {
        return JSON.parse(rawValue);
      } catch {
        return null;
      }
    default:
      return String(rawValue);
  }
}

function inferValueType(val) {
  if (typeof val === 'boolean') return 'BOOLEAN';
  if (typeof val === 'number') return 'NUMBER';
  return 'STRING';
}

export async function getPublicSettings() {
  const rows = await findPublicSettings();
  const grouped = {
    site: {},
    payment: {},
    operations: {},
    footer: {},
    chatbot: {},
  };

  for (const row of rows) {
    const groupKey = row.setting_group.toLowerCase();
    if (!grouped[groupKey]) {
      grouped[groupKey] = {};
    }
    grouped[groupKey][row.setting_key] = castSettingValue(row.setting_value, row.value_type);
  }

  grouped.payment = {
    payment_zalopay_enabled: true,
    payment_momo_enabled: true,
    payment_bank_enabled: true,
    ...grouped.payment,
  };
  grouped.payment.payment_zalopay_enabled = Boolean(grouped.payment.payment_zalopay_enabled);
  grouped.payment.payment_momo_enabled = Boolean(grouped.payment.payment_momo_enabled);
  grouped.payment.payment_bank_enabled = Boolean(grouped.payment.payment_bank_enabled);

  return grouped;
}

export async function getMaintenanceState({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && maintenanceCache && now - maintenanceCache.fetchedAt < MAINTENANCE_CACHE_TTL_MS) {
    return maintenanceCache.data;
  }

  const rows = await findMaintenanceSettings();
  let enabled = false;
  let message = '';

  for (const row of rows) {
    if (row.setting_key === 'maintenance_mode') {
      enabled = Boolean(castSettingValue(row.setting_value, row.value_type));
    } else if (row.setting_key === 'maintenance_message') {
      message = String(row.setting_value || '');
    }
  }

  const state = { enabled, message };
  maintenanceCache = { data: state, fetchedAt: now };
  return state;
}

export function clearMaintenanceCache() {
  maintenanceCache = null;
}

// ---------- ADMIN SYSTEM SETTINGS (UI25) ----------
export async function getAdminSettings() {
  const rows = await findAdminSystemSettings();
  const grouped = { site: {}, payment: {}, operations: {}, footer: {} };
  for (const row of rows) {
    const groupKey = row.setting_group.toLowerCase();
    grouped[groupKey][row.setting_key] = castSettingValue(row.setting_value, row.value_type);
  }
  grouped.payment = {
    payment_zalopay_enabled: true,
    payment_momo_enabled: true,
    payment_bank_enabled: true,
    ...grouped.payment,
  };
  grouped.payment.payment_zalopay_enabled = Boolean(grouped.payment.payment_zalopay_enabled);
  grouped.payment.payment_momo_enabled = Boolean(grouped.payment.payment_momo_enabled);
  grouped.payment.payment_bank_enabled = Boolean(grouped.payment.payment_bank_enabled);

  return grouped;
}

export async function updateAdminSettings(payload, adminUser) {
  await withTransaction(async (conn) => {
    const groupMap = [
      ['SITE', payload.site],
      ['PAYMENT', payload.payment],
      ['OPERATIONS', payload.operations],
      ['FOOTER', payload.footer],
    ];

    for (const [group, entries] of groupMap) {
      if (!entries || typeof entries !== 'object') continue;
      for (const [key, val] of Object.entries(entries)) {
        if (val === undefined) continue;
        await upsertSetting(conn, {
          group,
          key,
          value: String(val),
          valueType: inferValueType(val),
          updatedBy: adminUser.id,
        });
      }
    }
  });

  // Immediately invalidate maintenance cache so maintenance_mode takes effect instantaneously
  clearMaintenanceCache();
  return getAdminSettings();
}

export async function resetAdminSettings(adminUser) {
  await withTransaction(async (conn) => {
    for (const item of DEFAULT_SYSTEM_SETTINGS) {
      await upsertSetting(conn, {
        ...item,
        updatedBy: adminUser.id,
      });
    }
  });

  clearMaintenanceCache();
  return getAdminSettings();
}

export async function saveUploadedSiteAsset(assetType, file, adminUser) {
  const settingKey = assetType === 'favicon' ? 'site_favicon_url' : 'site_logo_url';
  const publicUrl = `/uploads/site/${file.filename}`;

  await withTransaction(async (conn) => {
    await upsertSetting(conn, {
      group: 'SITE',
      key: settingKey,
      value: publicUrl,
      valueType: 'STRING',
      updatedBy: adminUser.id,
    });
  });

  return {
    asset_type: assetType === 'favicon' ? 'favicon' : 'logo',
    setting_key: settingKey,
    url: publicUrl,
  };
}
