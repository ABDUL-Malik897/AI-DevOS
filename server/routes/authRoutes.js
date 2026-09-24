const express = require("express");
const passport = require("passport");
const { signup, login, getMe, createToken } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

router.get("/google",passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
}));

router.get("/google/callback", passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:3000/login"
}),(req, res) => {
    const token = createToken(req.user._id);
    res.redirect(`http://localhost:3000/auth/google/success#token=${token}`);
});

module.exports = router;