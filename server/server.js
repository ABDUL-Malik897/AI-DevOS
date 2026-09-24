const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const githubRoutes = require("./routes/githubRoutes");
const projectRoutes = require("./routes/projectRoutes");
const aiRoutes = require("./routes/aiRoutes");
require("./config/googleStrategy");

const app = express();

const allowedOrigins = ["http://localhost:3000","http://localhost:3001","http://localhost:5173",process.env.CLIENT_URL].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },credentials: true
}));

app.use(express.json({
    limit: "1mb"
}));
app.use(passport.initialize());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (res) => {
    res.json({
        message: "AI DevOS API is running"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`AI DevOS server running on port ${PORT}`);
});