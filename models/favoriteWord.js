const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favorSchema = Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    images: [String],
    reactions: {
      laugh: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
    },
    reviewCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

favorSchema.plugin(require("./plugins/isDeletedFalse"));

const Favor = mongoose.model("Favor", favorSchema);
module.exports = Favor;
