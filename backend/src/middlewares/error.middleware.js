import { AppError } from '../utils/AppError.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Đường dẫn API không tồn tại.'));
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
  let errors;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    errors = err.errors;
  } else if (err?.name === 'MulterError') {
    statusCode = 400;
    errorCode = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Dung lượng ảnh đại diện vượt quá giới hạn tối đa 2MB.'
        : 'Lỗi tải tệp lên hệ thống.';
  } else if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Dữ liệu JSON gửi lên không hợp lệ.';
  } else if (err?.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Dung lượng dữ liệu gửi lên vượt quá giới hạn cho phép.';
  } else if (err?.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Dữ liệu đã tồn tại trong hệ thống.';
  } else if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 400;
    errorCode = 'FOREIGN_KEY_VIOLATION';
    message = 'Dữ liệu tham chiếu không hợp lệ hoặc đang được sử dụng.';
  } else if (err?.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    statusCode = 400;
    errorCode = 'CONSTRAINT_VIOLATION';
    message = 'Giá trị dữ liệu không thỏa mãn ràng buộc nghiệp vụ.';
  }

  if (statusCode >= 500) {
    console.error(`[ERROR] ${err?.code || err?.name || 'Error'}: ${err?.message || 'Unknown error'}`);
  }

  const responsePayload = {
    success: false,
    message,
    errorCode,
  };

  if (Array.isArray(errors) && errors.length > 0) {
    responsePayload.errors = errors;
  }

  return res.status(statusCode).json(responsePayload);
}
