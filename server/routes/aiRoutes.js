const express = require("express");
const {searchProjectCode} = require("../controllers/aiController");

const router = express.Router();

router.post("/search/:projectId",searchProjectCode);

module.exports = router;