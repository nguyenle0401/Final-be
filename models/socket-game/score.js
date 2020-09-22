const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    score: String,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    d: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Score", Schema);
