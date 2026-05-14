const { findByUserId } = require('./categories.repository');
const logger = require('../../utils/logger');

async function getCategories(userId) {
  logger.debug('카테고리 목록 조회', { userId });
  return findByUserId(userId);
}

module.exports = { getCategories };
