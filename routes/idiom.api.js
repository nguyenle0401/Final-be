const express = require("express");
const router = express.Router();
const idiomController = require("../controllers/idiom.controller");
const validators = require("../middlewares/validators");
const authMiddleware = require("../middlewares/authentication");
const fileUpload = require("../helpers/upload.helper")("public/images/");
const uploader = fileUpload.uploader;
const { body, param } = require("express-validator");
/**
 * @route GET api/idioms?page=1&limit=10
 * @description Get idioms with pagination
 * @access Public
 */
router.get("/", idiomController.getIdioms);

router.get(
  "/favorite/:id",
  param("id").exists().isString().custom(validators.checkObjectId),
  authMiddleware.loginRequired,
  idiomController.favoriteWord
);

/**
 * @route GET api/idioms/:id
 * @description Get a single idiom
 * @access Public
 */
router.get(
  "/:id",
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  idiomController.getSingleIdiom
);

/**
 * @route POST api/idioms
 * @description Create a new idiom
 * @access Login required
 */
router.post(
  "/",
  authMiddleware.loginRequired,
  // uploader.array("images", 2),
  validators.validate([
    body("title", "Missing title").exists().notEmpty(),
    body("content", "Missing content").exists().notEmpty(),
  ]),
  idiomController.createNewIdiom
);

/**
 * @route PUT api/idioms/:id
 * @description Update a idiom
 * @access Login required
 */
router.put(
  "/:id",
  authMiddleware.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
    body("title", "Missing title").exists().notEmpty(),
    body("content", "Missing content").exists().notEmpty(),
  ]),
  idiomController.updateSingleIdiom
);

/**
 * @route DELETE api/idioms/:id
 * @description Delete a idiom
 * @access Login required
 */
router.delete(
  "/:id",
  authMiddleware.loginRequired,
  validators.validate([
    param("id").exists().isString().custom(validators.checkObjectId),
  ]),
  idiomController.deleteSingleIdiom
);

module.exports = router;
