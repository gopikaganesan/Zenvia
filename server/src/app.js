const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const healthRouter = require("./routes/health");
const { authRouter } = require("./routes/auth");
const communityPostsRouter = require("./routes/communityPosts");
const sosAlertsRouter = require("./routes/sosAlerts");
const cycleEntriesRouter = require("./routes/cycleEntries");
const usersRouter = require("./routes/users");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/posts", communityPostsRouter);
app.use("/api/v1/sos", sosAlertsRouter);
app.use("/api/v1/cycle-entries", cycleEntriesRouter);
app.use("/api/v1/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID format",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
