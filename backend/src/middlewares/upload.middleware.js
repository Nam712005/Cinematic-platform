import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AVATAR_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/avatars');
export const SITE_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/site');
fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(SITE_UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
    cb(null, AVATAR_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext === '.jpeg' ? '.jpg' : ALLOWED_EXTENSIONS.has(ext) ? ext : '.png';
    const userId = req.user?.id || 'user';
    const randomPart = crypto.randomBytes(8).toString('hex');
    cb(null, `avatar-${userId}-${Date.now()}-${randomPart}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new AppError(400, 'INVALID_FILE_TYPE', 'Chỉ chấp nhận ảnh định dạng JPG hoặc PNG.')
    );
  }
  return cb(null, true);
}

const multerAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
    files: 1,
  },
});

function hasValidImageSignature(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    const bytesRead = fs.readSync(fd, buffer, 0, 8, 0);
    if (bytesRead < 4) return false;

    // JPEG magic bytes: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytesRead >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    return isJpeg || isPng;
  } finally {
    fs.closeSync(fd);
  }
}

export function uploadAvatarMiddleware(req, res, next) {
  multerAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new AppError(400, 'FILE_REQUIRED', 'Vui lòng chọn ảnh đại diện để tải lên.'));
    }

    if (!hasValidImageSignature(req.file.path)) {
      fs.unlink(req.file.path, () => {});
      return next(
        new AppError(400, 'INVALID_IMAGE_CONTENT', 'Tệp tải lên không phải ảnh JPG hoặc PNG hợp lệ.')
      );
    }

    return next();
  });
}

const SITE_ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);
const SITE_ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.svg', '.ico']);

const siteStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(SITE_UPLOAD_DIR, { recursive: true });
    cb(null, SITE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = SITE_ALLOWED_EXTS.has(ext) ? ext : '.png';
    const prefix = req.body?.asset_type === 'favicon' ? 'favicon' : 'logo';
    const randomPart = crypto.randomBytes(6).toString('hex');
    cb(null, `${prefix}-${Date.now()}-${randomPart}${safeExt}`);
  },
});

const multerSiteAsset = multer({
  storage: siteStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!SITE_ALLOWED_MIMES.has(file.mimetype) || !SITE_ALLOWED_EXTS.has(ext)) {
      return cb(
        new AppError(400, 'INVALID_FILE_TYPE', 'Chỉ chấp nhận tệp hình ảnh PNG, JPG, SVG hoặc ICO.')
      );
    }
    return cb(null, true);
  },
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
    files: 1,
  },
});

export function uploadSiteAssetMiddleware(req, res, next) {
  multerSiteAsset.single('file')(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) {
      return next(new AppError(400, 'FILE_REQUIRED', 'Vui lòng chọn tệp Logo hoặc Favicon để tải lên.'));
    }
    return next();
  });
}
