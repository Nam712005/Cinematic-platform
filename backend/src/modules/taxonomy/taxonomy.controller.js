import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './taxonomy.service.js';

export const getPublicFilters = asyncHandler(async (_req, res) => {
  const data = await service.getPublicFilters();
  return sendSuccess(res, { message: 'Lấy danh mục bộ lọc thành công.', data });
});

// Categories
export const listCategories = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listCategories(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách danh mục thành công.', data: items, meta });
});

export const getCategory = asyncHandler(async (req, res) => {
  const data = await service.getCategory(Number(req.params.id));
  return sendSuccess(res, { message: 'Lấy chi tiết danh mục thành công.', data });
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = await service.createCategory(req.body);
  return sendCreated(res, { message: 'Thêm danh mục thành công.', data });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = await service.updateCategory(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật danh mục thành công.', data });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await service.deleteCategory(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa danh mục thành công.', data: null });
});

// Genres
export const listGenres = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listGenres(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách thể loại thành công.', data: items, meta });
});

export const createGenre = asyncHandler(async (req, res) => {
  const data = await service.createGenre(req.body);
  return sendCreated(res, { message: 'Thêm thể loại thành công.', data });
});

export const updateGenre = asyncHandler(async (req, res) => {
  const data = await service.updateGenre(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật thể loại thành công.', data });
});

export const deleteGenre = asyncHandler(async (req, res) => {
  await service.deleteGenre(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa thể loại thành công.', data: null });
});

// Countries
export const listCountries = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listCountries(req.query);
  return sendPaginated(res, { message: 'Lấy danh sách quốc gia thành công.', data: items, meta });
});

export const createCountry = asyncHandler(async (req, res) => {
  const data = await service.createCountry(req.body);
  return sendCreated(res, { message: 'Thêm quốc gia thành công.', data });
});

export const updateCountry = asyncHandler(async (req, res) => {
  const data = await service.updateCountry(Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật quốc gia thành công.', data });
});

export const deleteCountry = asyncHandler(async (req, res) => {
  await service.deleteCountry(Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa quốc gia thành công.', data: null });
});

// Actors & Directors
export const listActors = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listPersons('actors', req.query);
  return sendPaginated(res, { message: 'Lấy danh sách diễn viên thành công.', data: items, meta });
});

export const createActor = asyncHandler(async (req, res) => {
  const data = await service.createPerson('actors', req.body);
  return sendCreated(res, { message: 'Thêm diễn viên thành công.', data });
});

export const updateActor = asyncHandler(async (req, res) => {
  const data = await service.updatePerson('actors', Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật diễn viên thành công.', data });
});

export const deleteActor = asyncHandler(async (req, res) => {
  await service.deletePerson('actors', Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa diễn viên thành công.', data: null });
});

export const listDirectors = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listPersons('directors', req.query);
  return sendPaginated(res, { message: 'Lấy danh sách đạo diễn thành công.', data: items, meta });
});

export const createDirector = asyncHandler(async (req, res) => {
  const data = await service.createPerson('directors', req.body);
  return sendCreated(res, { message: 'Thêm đạo diễn thành công.', data });
});

export const updateDirector = asyncHandler(async (req, res) => {
  const data = await service.updatePerson('directors', Number(req.params.id), req.body);
  return sendSuccess(res, { message: 'Cập nhật đạo diễn thành công.', data });
});

export const deleteDirector = asyncHandler(async (req, res) => {
  await service.deletePerson('directors', Number(req.params.id));
  return sendSuccess(res, { message: 'Xóa đạo diễn thành công.', data: null });
});
