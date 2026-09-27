const r = require('express').Router();
const c = require('../controllers/categories');
const auth = require('../middleware/auth');

r.get(
  '/',
  c.list
);

r.post(
  '/',
  auth,
  c.create
);

r.delete(
  '/:id',
  auth,
  c.remove
);

module.exports = r;