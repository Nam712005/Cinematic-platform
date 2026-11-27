import { query } from '../../config/db.js';

const PUBLIC_CHATBOT_KEYS = ['chatbot_enabled', 'chatbot_display_name', 'chatbot_greeting'];

export async function findPublicSettings() {
  const sql = `
    SELECT setting_group, setting_key, setting_value, value_type
    FROM system_settings
    WHERE is_encrypted = 0
      AND (
        setting_group IN ('SITE', 'FOOTER', 'OPERATIONS', 'PAYMENT')
        OR (setting_group = 'CHATBOT' AND setting_key IN (?, ?, ?))
      )
    ORDER BY setting_group ASC, id ASC
  `;
  return query(sql, PUBLIC_CHATBOT_KEYS);
}

export async function findMaintenanceSettings() {
  const sql = `
    SELECT setting_key, setting_value, value_type
    FROM system_settings
    WHERE setting_key IN ('maintenance_mode', 'maintenance_message')
  `;
  return query(sql);
}

export async function findAdminSystemSettings() {
  return query(
    `SELECT setting_group, setting_key, setting_value, value_type, is_encrypted, updated_at
     FROM system_settings
     WHERE setting_group IN ('SITE', 'PAYMENT', 'OPERATIONS', 'FOOTER') AND is_encrypted = 0
     ORDER BY setting_group ASC, id ASC`
  );
}

export async function upsertSetting(conn, { group, key, value, valueType, updatedBy }) {
  await conn.execute(
    `INSERT INTO system_settings (setting_group, setting_key, setting_value, value_type, is_encrypted, updated_by)
     VALUES (?, ?, ?, ?, 0, ?)
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       value_type = VALUES(value_type),
       updated_by = VALUES(updated_by),
       updated_at = NOW()`,
    [group, key, String(value ?? ''), valueType, updatedBy]
  );
}
