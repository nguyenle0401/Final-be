const mongoose = require("mongoose");
const Idiom = require("./Idiom");
const Schema = mongoose.Schema;

const reviewSchema = Schema(
  {
    content: { type: String, required: true },
    user: { type: Schema.ObjectId, required: true, ref: "User" },
    idiom: { type: Schema.ObjectId, required: true, ref: "Idiom" },
    reactions: {
      laugh: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

reviewSchema.statics.calculateReviews = async function (idiomId) {
  const reviewCount = await this.find({ idiom: idiomId }).countDocuments();
  await Idiom.findByIdAndUpdate(idiomId, { reviewCount: reviewCount });
};

reviewSchema.post("save", async function () {
  await this.constructor.calculateReviews(this.idiom);
});

// Neither findByIdAndUpdate norfindByIdAndDelete have access to document middleware.
// They only get access to query middleware
// Inside this hook, this will point to the current query, not the current review.
// Therefore, to access the review, we’ll need to execute the query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.doc = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  await this.doc.constructor.calculateReviews(this.doc.idiom);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
