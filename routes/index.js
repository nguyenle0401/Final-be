var express = require("express");
var router = express.Router();

// userApi
const userApi = require("./user.api");
router.use("/users", userApi);

// authApi
const authApi = require("./auth.api");
router.use("/auth", authApi);

// idiomApi
const idiomApi = require("./idiom.api");
router.use("/idioms", idiomApi);

// reviewApi
const reviewApi = require("./review.api");
router.use("/reviews", reviewApi);

// reactionApi
const reactionApi = require("./reaction.api");
router.use("/reactions", reactionApi);

// friendshipApi
const friendshipApi = require("./friendship.api");
router.use("/friends", friendshipApi);

// conversationApi
const conversationApi = require("./conversation.api");
router.use("/conversations", conversationApi);
// game API
const gameApi = require("./game.api");
router.use("/games", gameApi);

const Room = require("../models/socket-game/room.js");
router.get("/rooms", async function (req, res, next) {
  let rooms = [
    { room: "Catalina", members: [] },
    { room: "Mojave", members: [] },
    { room: "Safari", members: [] },
    { room: "Sierra", members: [] },
  ];
  let result = await Room.insertMany(rooms);
  res.send(result);
});
router.get("/huhu", async function (req, res, next) {
  const Idiom = require("../models/Idiom");
  data = await Idiom.find(
    {},
    "-_id -reviewCount -reactions -createdAt -updatedAt -__v -author"
  );

  res.json(data);
});
module.exports = router;
