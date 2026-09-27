const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const token = (u) =>
  jwt.sign(
    { id: u._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role: requestedRole } = req.body;

    if (!name || !email || !password) {
      return res.status(422).json({
        message: 'Name, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(422).json({
        message: 'Password must be at least 6 characters'
      });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // Bootstrap admin email gets admin role automatically
    let role = 'reader';
    if (
      (process.env.BOOTSTRAP_ADMIN_EMAIL || '').toLowerCase() ===
      email.toLowerCase()
    ) {
      role = 'admin';
    } else if (requestedRole === 'author') {
      // Only allow self-registration as reader or author
      role = 'author';
    }
    // editor and admin can only be assigned by existing admin

    const hash = await bcrypt.hash(password, 10);

    const u = await User.create({
      name,
      email,
      password: hash,
      role
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role
      }
    });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const u = await User.findOne({ email });

    if (
      !u ||
      !u.active ||
      !(await bcrypt.compare(password, u.password))
    ) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    res.json({
      message: 'Login successful',
      token: token(u),
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role
      }
    });
  } catch (e) {
    next(e);
  }
};

exports.profile = async (req, res) =>
  res.json({
    user: req.user
  });

exports.listUsers = async (req, res, next) => {
  try {
    res.json(
      await User
        .find()
        .select('-password')
        .sort({ createdAt: -1 })
    );
  } catch (e) {
    next(e);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'editor', 'author', 'reader'].includes(role)) {
      return res.status(422).json({
        message: 'Invalid role'
      });
    }

    const u = await User
      .findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      )
      .select('-password');

    if (!u) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(u);
  } catch (e) {
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own account'
      });
    }

    const u = await User.findByIdAndDelete(req.params.id);

    if (!u) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    next(e);
  }
};