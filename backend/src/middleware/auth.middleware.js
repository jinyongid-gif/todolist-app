const { verifyToken } = require('../utils/jwt.utils');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('인증 실패: Authorization 헤더 없음', { path: req.path, method: req.method });
    return res.status(401).json({ error: 'Unauthorized', message: '인증이 필요합니다' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.user_id, email: decoded.email };
    logger.debug('인증 성공', { userId: decoded.user_id, path: req.path });
    next();
  } catch {
    logger.warn('인증 실패: 유효하지 않은 토큰', { path: req.path, method: req.method });
    res.status(401).json({ error: 'Unauthorized', message: '유효하지 않은 토큰입니다' });
  }
}

module.exports = { authenticate };
