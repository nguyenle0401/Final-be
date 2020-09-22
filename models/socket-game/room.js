const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

Schema.virtual("members", {
  ref: "User",
  localField: "_id", // Room._id
  foreignField: "room", // foreignField = User.room
});

module.exports = mongoose.model("Room", Schema);
