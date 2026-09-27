const Category = require('../models/Category');

exports.list = async (req, res, next) => {
  try {
    res.json(
      await Category
        .find()
        .sort({ name: 1 })
    );
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (!['admin', 'editor'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only admin/editor can manage categories'
      });
    }

    res.status(201).json(
      await Category.create({
        name: req.body.name,
        description: req.body.description || ''
      })
    );
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!['admin', 'editor'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only admin/editor can manage categories'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Category deleted'
    });
  } catch (e) {
    next(e);
  }
};