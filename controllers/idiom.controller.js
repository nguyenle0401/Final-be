const {
  AppError,
  catchAsync,
  sendResponse,
} = require("../helpers/utils.helper");
const Idiom = require("../models/Idiom");
const Review = require("../models/Review");
const idiomController = {};
const User = require("../models/User");
const mongoose = require("mongoose");

idiomController.getIdioms = catchAsync(async (req, res, next) => {
  let { page, limit, sortBy, ...filter } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const totalIdioms = await Idiom.countDocuments({
    ...filter,
    isDeleted: false,
  });
  const totalPages = Math.ceil(totalIdioms / limit);
  const offset = limit * (page - 1);

  // console.log({ filter, sortBy });
  const idioms = await Idiom.find(filter)
    .sort({ ...sortBy, createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author");

  return sendResponse(res, 200, true, { idioms, totalPages }, null, "");
});

idiomController.getSingleIdiom = catchAsync(async (req, res, next) => {
  let idiom = await Idiom.findById(req.params.id).populate("author");
  if (!idiom)
    return next(new AppError(404, "Idiom not found", "Get Single Idiom Error"));
  idiom = idiom.toJSON();
  idiom.reviews = await Review.find({ idiom: idiom._id }).populate("user");
  return sendResponse(res, 200, true, idiom, null, null);
});

idiomController.createNewIdiom = catchAsync(async (req, res, next) => {
  const author = req.userId;
  const { title, content } = req.body;
  let { images } = req.body;
  // if (req.files) {
  //   images = req.files.map((file) => {
  //     return file.path.split("public")[1].split("\\").join("/");
  //   });
  // }

  const idiom = await Idiom.create({
    title,
    content,
    author,
    images,
  });

  return sendResponse(
    res,
    200,
    true,
    idiom,
    null,
    "Create new idiom successful"
  );
});

idiomController.updateSingleIdiom = catchAsync(async (req, res, next) => {
  const author = req.userId;
  const idiomId = req.params.id;
  const { title, content } = req.body;

  const idiom = await Idiom.findOneAndUpdate(
    { _id: idiomId, author: author },
    { title, content },
    { new: true }
  );
  if (!idiom)
    return next(
      new AppError(
        400,
        "Idiom not found or User not authorized",
        "Update Idiom Error"
      )
    );
  return sendResponse(res, 200, true, idiom, null, "Update Idiom successful");
});

idiomController.deleteSingleIdiom = catchAsync(async (req, res, next) => {
  const author = req.userId;
  const idiomId = req.params.id;

  const idiom = await Idiom.findOneAndUpdate(
    { _id: idiomId, author: author },
    { isDeleted: true },
    { new: true }
  );
  if (!idiom)
    return next(
      new AppError(
        400,
        "Idiom not found or User not authorized",
        "Delete Idiom Error"
      )
    );
  return sendResponse(res, 200, true, null, null, "Delete Idiom successful");
});
//get /api/idioms/favorite/:id
idiomController.favoriteWord = catchAsync(async (req, res, next) => {
  const idiomId = req.params.id;
  const exist = await Idiom.exists({ _id: idiomId, isDeleted: false });
  if (!exist) {
    return next(new AppError(404, "Word not found"));
  }
  const check = await User.exists({
    _id: req.userId,
    favoriteWords: idiomId,
  });
  console.log(idiomId);
  let user;
  if (!check) {
    user = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        $addToSet: { favoriteWords: mongoose.Types.ObjectId(idiomId) },
      },
      { new: true }
    );
  } else {
    user = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        $pull: { favoriteWords: mongoose.Types.ObjectId(idiomId) },
      },
      { new: true }
    );
  }
  console.log(user);
  // console.log(user);
  res.send(user);
  // res.send("Hehe");
});

module.exports = idiomController;
