const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.body[f] || String(req.body[f]).trim() === '');
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: `필수 항목 누락: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

function validateEmail(req, res, next) {
  const { email } = req.body;
  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'BadRequest', message: '유효하지 않은 이메일 형식입니다' });
  }
  next();
}

module.exports = { validateRequired, validateEmail };
