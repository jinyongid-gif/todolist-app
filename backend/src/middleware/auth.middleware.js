const { verifyToken } = require('../utils/jwt.utils');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: '인증이 필요합니다' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.user_id, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: '유효하지 않은 토큰입니다' });
  }
}

module.exports = { authenticate };
