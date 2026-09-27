const { rateLimit } = require('express-rate-limit');
const xss = require('xss');

const clean = (v) =>
  typeof v === 'string'
    ? xss(v.trim())
    : Array.isArray(v)
      ? v.map(clean)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v).map(([k, val]) => [
              k,
              clean(val)
            ])
          )
        : v;

const sanitize = (req, res, next) => {
  req.body = clean(req.body);
  req.query = clean(req.query);

  next();
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  sanitize,
  apiLimiter
};