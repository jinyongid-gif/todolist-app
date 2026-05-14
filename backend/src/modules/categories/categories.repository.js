const db = require('../../config/db');

async function findByUserId(userId) {
  const result = await db.query(
    `SELECT id, name, is_default
     FROM categories
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY is_default DESC, id ASC`,
    [userId]
  );
  return result.rows;
}

async function existsForUser(categoryId, userId) {
  const result = await db.query(
    'SELECT 1 FROM categories WHERE id = $1 AND (user_id IS NULL OR user_id = $2)',
    [categoryId, userId]
  );
  return result.rowCount > 0;
}

module.exports = { findByUserId, existsForUser };
