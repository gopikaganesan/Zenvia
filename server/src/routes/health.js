const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (_req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: "API is running",
    database: {
      connected: isDatabaseConnected,
      state: mongoose.connection.readyState,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
