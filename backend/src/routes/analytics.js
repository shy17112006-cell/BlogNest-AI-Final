const r = require('express').Router();
const c = require('../controllers/analytics');
const auth = require('../middleware/auth');
const role = require('../middleware/rbac');

r.get(
  '/summary',
  auth,
  role('admin', 'editor'),
  c.summary
);

module.exports = r;