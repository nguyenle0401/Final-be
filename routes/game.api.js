const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authentication");
const userController = require("../controllers/user.controller");
const gameController = require("../controllers/game.controller");

router.route("/new").get(authMiddleware.loginRequired, gameController.newGame);

module.exports = router;
