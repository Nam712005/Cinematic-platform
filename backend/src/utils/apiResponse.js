export function sendSuccess(res, { message = 'Thành công', data = null, meta = undefined, statusCode = 200 } = {}) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

export function sendCreated(res, { message = 'Tạo mới thành công', data = null } = {}) {
  return sendSuccess(res, { message, data, statusCode: 201 });
}

export function sendPaginated(res, { message = 'Thành công', data = [], meta }) {
  return sendSuccess(res, { message, data, meta, statusCode: 200 });
}
