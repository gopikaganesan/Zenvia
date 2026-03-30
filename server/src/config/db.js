const mongoose = require("mongoose");

async function connectDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is missing. Starting API without MongoDB connection.");
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

module.exports = { connectDatabase };
