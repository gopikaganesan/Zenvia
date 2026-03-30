const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    message: {
      type: String,
      default: "I need help immediately!",
    },
    active: {
      type: Boolean,
      default: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Geospatial index so we can query "nearby" alerts
sosAlertSchema.index({ location: "2dsphere" });

const SOSAlert = mongoose.model("SOSAlert", sosAlertSchema);

module.exports = SOSAlert;
