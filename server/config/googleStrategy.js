const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                if (!email) {
                    return done(null, false);
                }

                let user = await User.findOne({ googleId });
                if (user) {
                    return done(null, user);
                }
                user = await User.findOne({ email });
                if (user) {
                    user.googleId = googleId;
                    await user.save();
                    return done(null, user);
                }

                user = await User.create({
                    name,
                    email,
                    googleId,
                    password: null
                });
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

module.exports = passport;