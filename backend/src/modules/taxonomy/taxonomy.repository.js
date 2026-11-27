import { pool, query } from '../../config/db.js';

export async function findPublicCategories() {
  return query(
    'SELECT id, name, slug, description FROM categories WHERE status = 1 ORDER BY id ASC'
  );
}

export async function findPublicGenres() {
  return query(
    'SELECT id, name, slug, description FROM genres WHERE status = 1 ORDER BY name ASC'
  );
}

export async function findPublicCountries() {
  return query('SELECT id, code, name, slug FROM countries ORDER BY name ASC');
}

export async function findDistinctReleaseYears() {
  const rows = await query(
    `SELECT DISTINCT release_year AS year
     FROM movies
     WHERE status = 1 AND release_year IS NOT NULL
     ORDER BY release_year DESC`
  );
  return rows.map((r) => r.year);
}

// ---------- ADMIN CATEGORIES (UI18) ----------
export async function listCategoriesAdmin({ q = '', limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  const where = [];
  const params = [];
  if (q) {
    where.push('(c.name LIKE ? OR c.slug LIKE ? OR c.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRow] = await query(
    `SELECT COUNT(*) AS total FROM categories c ${whereSql}`,
    params
  );

  const items = await query(
    `SELECT c.id, c.name, c.slug, c.description, c.status, c.created_at, c.updated_at,
            COUNT(mc.movie_id) AS movie_count
     FROM categories c
     LEFT JOIN movie_categories mc ON mc.category_id = c.id
     ${whereSql}
     GROUP BY c.id
     ORDER BY c.id ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return { items, total: countRow.total };
}

export async function findCategoryById(id) {
  const rows = await query(
    `SELECT c.*, COUNT(mc.movie_id) AS movie_count
     FROM categories c
     LEFT JOIN movie_categories mc ON mc.category_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );
  return rows[0] || null;
}

export async function createCategory({ name, slug, description, status }) {
  const [res] = await pool.execute(
    'INSERT INTO categories (name, slug, description, status) VALUES (?, ?, ?, ?)',
    [name, slug, description || null, status]
  );
  return findCategoryById(res.insertId);
}

export async function updateCategory(id, { name, slug, description, status }) {
  await query(
    'UPDATE categories SET name = ?, slug = ?, description = ?, status = ? WHERE id = ?',
    [name, slug, description || null, status, id]
  );
  return findCategoryById(id);
}

export async function deleteCategory(id) {
  const [res] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// ---------- ADMIN GENRES ----------
export async function listGenresAdmin({ q = '', limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 50);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  const where = q ? 'WHERE g.name LIKE ? OR g.slug LIKE ?' : '';
  const params = q ? [`%${q}%`, `%${q}%`] : [];

  const [countRow] = await query(`SELECT COUNT(*) AS total FROM genres g ${where}`, params);
  const items = await query(
    `SELECT g.*, COUNT(mg.movie_id) AS movie_count
     FROM genres g
     LEFT JOIN movie_genres mg ON mg.genre_id = g.id
     ${where}
     GROUP BY g.id
     ORDER BY g.name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  return { items, total: countRow.total };
}

export async function findGenreById(id) {
  const rows = await query('SELECT * FROM genres WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createGenre({ name, slug, description, status }) {
  const [res] = await pool.execute(
    'INSERT INTO genres (name, slug, description, status) VALUES (?, ?, ?, ?)',
    [name, slug, description || null, status]
  );
  return findGenreById(res.insertId);
}

export async function updateGenre(id, { name, slug, description, status }) {
  await query('UPDATE genres SET name = ?, slug = ?, description = ?, status = ? WHERE id = ?', [
    name,
    slug,
    description || null,
    status,
    id,
  ]);
  return findGenreById(id);
}

export async function deleteGenre(id) {
  const [res] = await pool.execute('DELETE FROM genres WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// ---------- ADMIN COUNTRIES ----------
export async function listCountriesAdmin({ q = '', limit, offset }) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 50);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  const where = q ? 'WHERE co.name LIKE ? OR co.slug LIKE ? OR co.code LIKE ?' : '';
  const params = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

  const [countRow] = await query(`SELECT COUNT(*) AS total FROM countries co ${where}`, params);
  const items = await query(
    `SELECT co.*, COUNT(mc.movie_id) AS movie_count
     FROM countries co
     LEFT JOIN movie_countries mc ON mc.country_id = co.id
     ${where}
     GROUP BY co.id
     ORDER BY co.name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  return { items, total: countRow.total };
}

export async function findCountryById(id) {
  const rows = await query('SELECT * FROM countries WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createCountry({ code, name, slug }) {
  const [res] = await pool.execute(
    'INSERT INTO countries (code, name, slug) VALUES (?, ?, ?)',
    [code || null, name, slug]
  );
  return findCountryById(res.insertId);
}

export async function updateCountry(id, { code, name, slug }) {
  await query('UPDATE countries SET code = ?, name = ?, slug = ? WHERE id = ?', [
    code || null,
    name,
    slug,
    id,
  ]);
  return findCountryById(id);
}

export async function deleteCountry(id) {
  const [res] = await pool.execute('DELETE FROM countries WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// ---------- ADMIN ACTORS & DIRECTORS ----------
export async function listPersonsAdmin(table, { q = '', limit, offset }) {
  const safeTable = table === 'directors' ? 'directors' : 'actors';
  const joinTable = table === 'directors' ? 'movie_directors' : 'movie_actors';
  const fkCol = table === 'directors' ? 'director_id' : 'actor_id';
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 50);
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  const where = q ? 'WHERE p.name LIKE ? OR p.slug LIKE ?' : '';
  const params = q ? [`%${q}%`, `%${q}%`] : [];

  const [countRow] = await query(`SELECT COUNT(*) AS total FROM ${safeTable} p ${where}`, params);
  const items = await query(
    `SELECT p.*, COUNT(j.movie_id) AS movie_count
     FROM ${safeTable} p
     LEFT JOIN ${joinTable} j ON j.${fkCol} = p.id
     ${where}
     GROUP BY p.id
     ORDER BY p.name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  return { items, total: countRow.total };
}

export async function findPersonById(table, id) {
  const safeTable = table === 'directors' ? 'directors' : 'actors';
  const rows = await query(`SELECT * FROM ${safeTable} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function createPerson(table, { name, slug, avatar, bio, birth_date, nationality }) {
  const safeTable = table === 'directors' ? 'directors' : 'actors';
  const [res] = await pool.execute(
    `INSERT INTO ${safeTable} (name, slug, avatar, bio, birth_date, nationality) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, slug, avatar || null, bio || null, birth_date || null, nationality || null]
  );
  return findPersonById(safeTable, res.insertId);
}

export async function updatePerson(table, id, { name, slug, avatar, bio, birth_date, nationality }) {
  const safeTable = table === 'directors' ? 'directors' : 'actors';
  await query(
    `UPDATE ${safeTable} SET name = ?, slug = ?, avatar = ?, bio = ?, birth_date = ?, nationality = ? WHERE id = ?`,
    [name, slug, avatar || null, bio || null, birth_date || null, nationality || null, id]
  );
  return findPersonById(safeTable, id);
}

export async function deletePerson(table, id) {
  const safeTable = table === 'directors' ? 'directors' : 'actors';
  const [res] = await pool.execute(`DELETE FROM ${safeTable} WHERE id = ?`, [id]);
  return res.affectedRows > 0;
}
