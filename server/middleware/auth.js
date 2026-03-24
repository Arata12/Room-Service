const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (process.env.TEST_MODE === 'true') {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const secret = process.env.ADMIN_SECRET;

  if (!token || !secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    jwt.verify(token, secret);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
