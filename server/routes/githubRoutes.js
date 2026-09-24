const express = require("express");
const {getGithubLoginUrl, githubCallback, getRepositories} = require("../controllers/githubController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/connect", protect,getGithubLoginUrl);
router.get("/callback", githubCallback);
router.get("/repos", protect, getRepositories);

module.exports = router;