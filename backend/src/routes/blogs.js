const r = require('express').Router();
const c = require('../controllers/blog');

const auth = require('../middleware/auth');
const optional = require('../middleware/auth').optional;

r.post(
  '/',
  auth,
  c.create
);

r.get(
  '/my',
  auth,
  c.myBlogs
);

r.get(
  '/',
  optional,
  c.list
);

r.get(
  '/:id',
  c.get
);

r.put(
  '/:id',
  auth,
  c.update
);

r.delete(
  '/:id',
  auth,
  c.remove
);

r.post(
  '/:id/like',
  auth,
  c.like
);

r.patch(
  '/:id/status',
  auth,
  c.changeStatus
);

module.exports = r;