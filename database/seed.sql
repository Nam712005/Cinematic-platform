-- =============================================================================
-- CINEMATIC - Seed Data (MySQL 8.4)
-- Idempotent seed script for roles, official Premium plans, settings & taxonomy
-- =============================================================================

USE `cinematic`;
SET NAMES utf8mb4;

-- 1. Roles (ADMIN, MEMBER)
INSERT INTO `roles` (`code`, `name`, `description`)
VALUES
  ('ADMIN', 'Quản trị viên', 'Toàn quyền quản trị hệ thống CINEMATIC'),
  ('MEMBER', 'Thành viên', 'Tài khoản thành viên xem phim, tương tác, mua Premium và dùng Chatbot AI')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`);

-- 2. Official Initial Premium Plans (1M: 29.000, 6M: 149.000, 12M: 249.000 VND)
INSERT INTO `premium_plans` (`code`, `name`, `duration_days`, `price`, `original_price`, `description`, `features`, `is_popular`, `status`)
VALUES
  (
    'PLAN_1M',
    'Premium 1 tháng',
    30,
    29000.00,
    39000.00,
    'Gói Premium linh hoạt 30 ngày với đầy đủ đặc quyền xem phim chất lượng cao.',
    '["Xem toàn bộ phim gắn nhãn Premium","Trải nghiệm không quảng cáo gián đoạn","Chất lượng hình ảnh sắc nét Full HD","Hỗ trợ phát trên 1 thiết bị cùng lúc"]',
    0,
    1
  ),
  (
    'PLAN_6M',
    'Premium 6 tháng',
    180,
    149000.00,
    174000.00,
    'Gói tiết kiệm 180 ngày dành cho thành viên xem phim thường xuyên.',
    '["Xem toàn bộ phim gắn nhãn Premium","Trải nghiệm không quảng cáo gián đoạn","Chất lượng độ phân giải cao Full HD/2K","Hỗ trợ phát trên 2 thiết bị cùng lúc"]',
    0,
    1
  ),
  (
    'PLAN_12M',
    'Premium 12 tháng',
    365,
    249000.00,
    348000.00,
    'Gói tiết kiệm nhất 365 ngày với toàn bộ đặc quyền cao cấp của CINEMATIC.',
    '["Toàn bộ quyền lợi Premium cao cấp nhất","Không quảng cáo trong suốt 12 tháng","Chất lượng hình ảnh cao nhất Ultra HD 4K","Hỗ trợ phát trên 4 thiết bị cùng lúc","Ưu tiên băng thông phát phim tốc độ cao"]',
    1,
    1
  )
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `duration_days` = VALUES(`duration_days`),
  `price` = VALUES(`price`),
  `original_price` = VALUES(`original_price`),
  `description` = VALUES(`description`),
  `features` = VALUES(`features`);

-- 3. Default Categories
INSERT INTO `categories` (`name`, `slug`, `description`, `status`)
VALUES
  ('Phim lẻ', 'phim-le', 'Phim điện ảnh có thời lượng độc lập', 1),
  ('Phim bộ', 'phim-bo', 'Phim truyền hình gồm nhiều tập', 1),
  ('Phim chiếu rạp', 'phim-chieu-rap', 'Phim phát hành tại rạp chiếu phim', 1),
  ('Hoạt hình', 'hoat-hinh', 'Phim hoạt hình và Anime', 1),
  ('TV Shows', 'tv-shows', 'Chương trình truyền hình giải trí', 1)
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`);

-- 4. Default Genres
INSERT INTO `genres` (`name`, `slug`, `description`, `status`)
VALUES
  ('Hành động', 'hanh-dong', 'Phim hành động, võ thuật, rượt đuổi', 1),
  ('Phiêu lưu', 'phieu-luu', 'Phim khám phá, hành trình phiêu lưu', 1),
  ('Giả tưởng', 'gia-tuong', 'Phim phép thuật, thế giới kỳ ảo', 1),
  ('Khoa học viễn tưởng', 'khoa-hoc-vien-tuong', 'Phim công nghệ tương lai, không gian', 1),
  ('Kinh dị', 'kinh-di', 'Phim kinh dị, siêu nhiên, giật gân', 1),
  ('Bí ẩn', 'bi-an', 'Phim trinh thám, phá án, bí ẩn', 1),
  ('Hình sự', 'hinh-su', 'Phim tội phạm, điều tra hình sự', 1),
  ('Tâm lý', 'tam-ly', 'Phim khai thác chiều sâu tâm lý nhân vật', 1),
  ('Chính kịch', 'chinh-kich', 'Phim chính kịch, xã hội', 1),
  ('Tình cảm', 'tinh-cam', 'Phim lãng mạn, tình cảm', 1),
  ('Hài hước', 'hai-huoc', 'Phim giải trí, hài hước', 1),
  ('Hoạt hình', 'hoat-hinh', 'Phim hoạt hình, Anime', 1),
  ('Lịch sử', 'lich-su', 'Phim tái hiện lịch sử, cổ trang', 1)
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`);

-- 5. Default Countries
INSERT INTO `countries` (`code`, `name`, `slug`)
VALUES
  ('VN', 'Việt Nam', 'viet-nam'),
  ('US', 'Mỹ', 'my'),
  ('KR', 'Hàn Quốc', 'han-quoc'),
  ('JP', 'Nhật Bản', 'nhat-ban'),
  ('GB', 'Anh', 'anh'),
  ('CN', 'Trung Quốc', 'trung-quoc'),
  ('TH', 'Thái Lan', 'thai-lan'),
  ('FR', 'Pháp', 'phap')
ON DUPLICATE KEY UPDATE
  `code` = VALUES(`code`);

-- 6. Default System Settings (SITE, PAYMENT, OPERATIONS, FOOTER, CHATBOT)
INSERT INTO `system_settings` (`setting_group`, `setting_key`, `setting_value`, `value_type`, `is_encrypted`)
VALUES
  -- SITE
  ('SITE', 'site_name', 'CINEMATIC', 'STRING', 0),
  ('SITE', 'site_email', 'cinematic.support@gmail.com', 'STRING', 0),
  ('SITE', 'site_phone', '1900 1234', 'STRING', 0),
  ('SITE', 'site_description', 'CINEMATIC là nền tảng xem phim trực tuyến chất lượng cao tích hợp trợ lý hỏi đáp AI thông minh.', 'STRING', 0),
  ('SITE', 'site_logo_url', '', 'STRING', 0),
  ('SITE', 'site_favicon_url', '', 'STRING', 0),

  -- PAYMENT (Mock Payment Display Config Only)
  ('PAYMENT', 'payment_zalopay_enabled', 'true', 'BOOLEAN', 0),
  ('PAYMENT', 'payment_momo_enabled', 'true', 'BOOLEAN', 0),
  ('PAYMENT', 'payment_bank_enabled', 'true', 'BOOLEAN', 0),
  ('PAYMENT', 'payment_bank_name', 'Ngân hàng TMCP Quân đội (MBBank)', 'STRING', 0),
  ('PAYMENT', 'payment_bank_account_no', '090123456789', 'STRING', 0),
  ('PAYMENT', 'payment_bank_account_name', 'CINEMATIC MEDIA', 'STRING', 0),
  ('PAYMENT', 'payment_bank_syntax', 'CINEMATIC [MA_DON_HANG]', 'STRING', 0),

  -- OPERATIONS
  ('OPERATIONS', 'movies_per_page', '12', 'NUMBER', 0),
  ('OPERATIONS', 'comments_per_page', '10', 'NUMBER', 0),
  ('OPERATIONS', 'admin_episodes_per_page', '10', 'NUMBER', 0),
  ('OPERATIONS', 'maintenance_mode', 'false', 'BOOLEAN', 0),
  ('OPERATIONS', 'maintenance_message', 'Hệ thống CINEMATIC đang bảo trì định kỳ để nâng cấp chất lượng dịch vụ. Vui lòng quay lại sau ít phút!', 'STRING', 0),

  -- FOOTER
  ('FOOTER', 'footer_copyright', '© 2026 CINEMATIC. Tất cả các quyền được bảo lưu.', 'STRING', 0),
  ('FOOTER', 'footer_support_email', 'cinematic.support@gmail.com', 'STRING', 0),
  ('FOOTER', 'footer_address', '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng, Việt Nam', 'STRING', 0),
  ('FOOTER', 'footer_terms_url', '/terms-of-service', 'STRING', 0),
  ('FOOTER', 'footer_privacy_url', '/privacy-policy', 'STRING', 0),

  -- CHATBOT (OpenAI & Gemini - Q&A only, NO movie recommendation)
  ('CHATBOT', 'chatbot_enabled', 'true', 'BOOLEAN', 0),
  ('CHATBOT', 'chatbot_provider', 'OPENAI', 'STRING', 0),
  ('CHATBOT', 'chatbot_openai_model', 'gpt-4o-mini', 'STRING', 0),
  ('CHATBOT', 'chatbot_openai_api_key', '', 'STRING', 1),
  ('CHATBOT', 'chatbot_gemini_model', 'gemini-2.0-flash', 'STRING', 0),
  ('CHATBOT', 'chatbot_gemini_api_key', '', 'STRING', 1),
  ('CHATBOT', 'chatbot_groq_model', 'llama-3.3-70b-versatile', 'STRING', 0),
  ('CHATBOT', 'chatbot_groq_api_key', '', 'STRING', 1),
  ('CHATBOT', 'chatbot_display_name', 'CINEMATIC AI', 'STRING', 0),
  ('CHATBOT', 'chatbot_greeting', 'Xin chào! Tôi là trợ lý hỏi đáp CINEMATIC AI. Tôi có thể giải đáp thông tin về phim, diễn viên, hướng dẫn xem phim và gói Premium.', 'STRING', 0),
  ('CHATBOT', 'chatbot_system_prompt', 'Bạn là trợ lý hỏi đáp của nền tảng xem phim CINEMATIC. Nhiệm vụ của bạn là trả lời câu hỏi về thông tin phim, đạo diễn, diễn viên, tóm tắt không tiết lộ kết thúc và hướng dẫn sử dụng website, gói Premium bằng tiếng Việt lịch sự, ngắn gọn. Chỉ trả lời trong phạm vi điện ảnh và hệ thống CINEMATIC.', 'STRING', 0)
ON DUPLICATE KEY UPDATE
  `setting_group` = VALUES(`setting_group`);
