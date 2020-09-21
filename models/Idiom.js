const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const idiomSchema = Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    images: [String],
    reviewCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

idiomSchema.plugin(require("./plugins/isDeletedFalse"));

const Idiom = mongoose.model("Idiom", idiomSchema);
module.exports = Idiom;
