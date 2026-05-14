const db = require('../../config/db');

async function findByEmail(email) {
  const result = await db.query(
    'SELECT id, email, password, name, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function createUser({ email, password, name }) {
  const result = await db.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [email, password, name]
  );
  return result.rows[0];
}

module.exports = { findByEmail, createUser };
