const { findByUserId } = require('./categories.repository');

async function getCategories(userId) {
  return findByUserId(userId);
}

module.exports = { getCategories };
