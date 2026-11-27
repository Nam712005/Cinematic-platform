import { AppError } from '../utils/AppError.js';

export function validate(schema, target = 'body') {
  return function validationMiddleware(req, _res, next) {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || target,
        message: issue.message,
      }));
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu đầu vào không hợp lệ.', formattedErrors)
      );
    }

    req[target] = result.data;
    return next();
  };
}
