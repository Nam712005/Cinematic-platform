import { AppError } from '../../utils/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { slugify } from '../../utils/slugify.js';
import * as repo from './taxonomy.repository.js';

function resolveSlug(name, providedSlug) {
  const finalSlug = providedSlug && providedSlug.trim() ? providedSlug.trim() : slugify(name);
  if (!finalSlug) {
    throw new AppError(400, 'INVALID_SLUG', 'Không thể tạo slug hợp lệ từ tên đã nhập.');
  }
  return finalSlug;
}

export async function getPublicFilters() {
  const [categories, genres, countries, years] = await Promise.all([
    repo.findPublicCategories(),
    repo.findPublicGenres(),
    repo.findPublicCountries(),
    repo.findDistinctReleaseYears(),
  ]);

  return { categories, genres, countries, years };
}

// ---------- Categories ----------
export async function listCategories(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 20, 100);
  const q = String(queryObj.q || '').trim();
  const { items, total } = await repo.listCategoriesAdmin({ q, limit, offset });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function getCategory(id) {
  const item = await repo.findCategoryById(id);
  if (!item) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
  return item;
}

export async function createCategory(payload) {
  return repo.createCategory({
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function updateCategory(id, payload) {
  await getCategory(id);
  return repo.updateCategory(id, {
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function deleteCategory(id) {
  const deleted = await repo.deleteCategory(id);
  if (!deleted) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
}

// ---------- Genres ----------
export async function listGenres(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 50, 100);
  const q = String(queryObj.q || '').trim();
  const { items, total } = await repo.listGenresAdmin({ q, limit, offset });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function createGenre(payload) {
  return repo.createGenre({
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function updateGenre(id, payload) {
  const existing = await repo.findGenreById(id);
  if (!existing) throw new AppError(404, 'GENRE_NOT_FOUND', 'Không tìm thấy thể loại.');
  return repo.updateGenre(id, {
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function deleteGenre(id) {
  const deleted = await repo.deleteGenre(id);
  if (!deleted) throw new AppError(404, 'GENRE_NOT_FOUND', 'Không tìm thấy thể loại.');
}

// ---------- Countries ----------
export async function listCountries(queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 50, 100);
  const q = String(queryObj.q || '').trim();
  const { items, total } = await repo.listCountriesAdmin({ q, limit, offset });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function createCountry(payload) {
  return repo.createCountry({
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function updateCountry(id, payload) {
  const existing = await repo.findCountryById(id);
  if (!existing) throw new AppError(404, 'COUNTRY_NOT_FOUND', 'Không tìm thấy quốc gia.');
  return repo.updateCountry(id, {
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function deleteCountry(id) {
  const deleted = await repo.deleteCountry(id);
  if (!deleted) throw new AppError(404, 'COUNTRY_NOT_FOUND', 'Không tìm thấy quốc gia.');
}

// ---------- Actors & Directors ----------
export async function listPersons(table, queryObj) {
  const { page, limit, offset } = parsePagination(queryObj, 50, 100);
  const q = String(queryObj.q || '').trim();
  const { items, total } = await repo.listPersonsAdmin(table, { q, limit, offset });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export async function createPerson(table, payload) {
  return repo.createPerson(table, {
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function updatePerson(table, id, payload) {
  const existing = await repo.findPersonById(table, id);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy nhân sự.');
  return repo.updatePerson(table, id, {
    ...payload,
    slug: resolveSlug(payload.name, payload.slug),
  });
}

export async function deletePerson(table, id) {
  const deleted = await repo.deletePerson(table, id);
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy nhân sự.');
}
