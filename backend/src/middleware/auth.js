const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';

    if (!h.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(
      h.slice(7),
      process.env.JWT_SECRET
    );

    const user = await User
      .findById(decoded.id)
      .select('-password');

    if (!user || !user.active) {
      return res.status(401).json({
        message: 'Invalid user'
      });
    }

    req.user = user;

    next();
  } catch (e) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

module.exports.optional = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';

    if (h.startsWith('Bearer ')) {
      const decoded = jwt.verify(
        h.slice(7),
        process.env.JWT_SECRET
      );

      req.user = await User
        .findById(decoded.id)
        .select('-password');
    }
  } catch (e) {
    // Continue without authentication
  }

  next();
};