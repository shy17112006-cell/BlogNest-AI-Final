const r = require('express').Router();
const c = require('../controllers/auth');
const auth = require('../middleware/auth');
const role = require('../middleware/rbac');

r.post(
  '/register',
  c.register
);

r.post(
  '/login',
  c.login
);

r.get(
  '/profile',
  auth,
  c.profile
);

r.get(
  '/users',
  auth,
  role('admin'),
  c.listUsers
);

r.patch(
  '/users/:id/role',
  auth,
  role('admin'),
  c.updateRole
);

module.exports = r;