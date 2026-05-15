const { Pool, types } = require('pg');
const { config } = require('./env');
const logger = require('../utils/logger');

// DATE 타입(OID 1082)을 JS Date 객체로 변환하지 않고 문자열(YYYY-MM-DD)로 반환
types.setTypeParser(1082, (val) => val);

const db = new Pool({
  connectionString: config.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  options: '-c client_encoding=UTF8',
});

db.on('error', (err) => {
  logger.error('DB 연결 풀 에러:', err);
});

module.exports = db;
