const db = require('../../config/db');

async function findByUserId(userId, { category_id, is_completed, overdue } = {}) {
  const conditions = ['user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (category_id !== undefined) {
    conditions.push(`category_id = $${idx++}`);
    params.push(category_id);
  }

  if (is_completed !== undefined) {
    conditions.push(`is_completed = $${idx++}`);
    params.push(is_completed);
  }

  if (overdue) {
    conditions.push('due_date < CURRENT_DATE AND is_completed = FALSE');
  }

  const result = await db.query(
    `SELECT * FROM todos WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
}

async function findById(id) {
  const result = await db.query('SELECT * FROM todos WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function create({ user_id, category_id, title, description, due_date }) {
  const result = await db.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user_id, category_id, title, description || null, due_date || null]
  );
  return result.rows[0];
}

async function update(id, { title, category_id, description, due_date }) {
  const result = await db.query(
    `UPDATE todos
     SET title = $2, category_id = $3, description = $4, due_date = $5, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, title, category_id, description ?? null, due_date ?? null]
  );
  return result.rows[0] || null;
}

async function updateComplete(id) {
  const result = await db.query(
    `UPDATE todos
     SET is_completed = NOT is_completed, updated_at = NOW()
     WHERE id = $1
     RETURNING id, is_completed, updated_at`,
    [id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  await db.query('DELETE FROM todos WHERE id = $1', [id]);
}

module.exports = { findByUserId, findById, create, update, updateComplete, remove };
