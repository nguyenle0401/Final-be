const {
  catchAsync,
  AppError,
  sendResponse,
} = require("../helpers/utils.helper");
const Idiom = require("../models/Idiom");

exports.newGame = catchAsync(async (req, res, next) => {
  let time = req.query.time || 5;
  time = time > 30 ? 30 : 5;
  let qty = req.query.qty * 1 || 5;
  qty = qty > 20 ? 20 : qty;

  const rawQuestions = await Idiom.aggregate([
    { $sample: { size: qty } },
    { $project: { _id: 1, title: 1, content: 1 } },
  ]);

  const fakePromises = rawQuestions.map(
    async (e) =>
      await Idiom.aggregate([
        { $match: { content: { $ne: e.content } } },
        { $sample: { size: 100 } },
        { $project: { _id: 1, content: 1 } },
      ])
  );
  const fake = await Promise.all(fakePromises);
  const questions = rawQuestions.map((e, i) => {
    console.log("ahihe", e);
    return {
      ...e,
      answer: e.content,
      answer1: fake[i][0].content,
      answer2: fake[i][1].content,
      answer3: fake[i][2].content,
    };
  });
  const game = {
    time,
    qty,
    questions,
  };
  res.send(game);
});
