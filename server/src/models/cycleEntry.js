const mongoose = require("mongoose");

const cycleEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodStartDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    periodEndDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    flowLevel: {
      type: String,
      enum: ["light", "medium", "heavy"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  },
);

cycleEntrySchema.index({ user: 1, periodStartDate: -1, createdAt: -1 });

const CycleEntry = mongoose.model("CycleEntry", cycleEntrySchema);

module.exports = CycleEntry;
