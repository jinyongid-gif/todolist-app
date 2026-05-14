const categoriesService = require('./categories.service');

async function list(req, res, next) {
  try {
    const data = await categoriesService.getCategories(req.user.id);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
