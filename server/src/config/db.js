const mongoose = require("mongoose");

async function connectDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is missing. Starting API without MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

module.exports = { connectDatabase };
