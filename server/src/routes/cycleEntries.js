const express = require("express");
const mongoose = require("mongoose");

const CycleEntry = require("../models/cycleEntry");
const { authMiddleware } = require("./auth");

const router = express.Router();

function ensureDB(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: "Database not connected" });
  }
  return next();
}

function isDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

router.use(ensureDB);
router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const entries = await CycleEntry.find({ user: req.user._id }).sort({ periodStartDate: -1, createdAt: -1 });
    return res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { periodStartDate, periodEndDate, flowLevel } = req.body;

    if (!periodStartDate || !periodEndDate) {
      return res.status(400).json({ success: false, message: "periodStartDate and periodEndDate are required" });
    }

    if (!isDateString(periodStartDate) || !isDateString(periodEndDate)) {
      return res.status(400).json({ success: false, message: "Dates must be YYYY-MM-DD format" });
    }

    if (new Date(`${periodEndDate}T00:00:00`) < new Date(`${periodStartDate}T00:00:00`)) {
      return res.status(400).json({ success: false, message: "periodEndDate must be after periodStartDate" });
    }

    const entry = await CycleEntry.create({
      user: req.user._id,
      periodStartDate,
      periodEndDate,
      flowLevel: flowLevel || "medium",
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { periodStartDate, periodEndDate, flowLevel } = req.body;
    const entry = await CycleEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Cycle entry not found" });
    }

    if (!entry.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!periodStartDate || !periodEndDate) {
      return res.status(400).json({ success: false, message: "periodStartDate and periodEndDate are required" });
    }

    if (!isDateString(periodStartDate) || !isDateString(periodEndDate)) {
      return res.status(400).json({ success: false, message: "Dates must be YYYY-MM-DD format" });
    }

    if (new Date(`${periodEndDate}T00:00:00`) < new Date(`${periodStartDate}T00:00:00`)) {
      return res.status(400).json({ success: false, message: "periodEndDate must be after periodStartDate" });
    }

    entry.periodStartDate = periodStartDate;
    entry.periodEndDate = periodEndDate;
    entry.flowLevel = flowLevel || "medium";
    await entry.save();

    return res.json({ success: true, data: entry });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const entry = await CycleEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Cycle entry not found" });
    }

    if (!entry.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await entry.deleteOne();
    return res.json({ success: true, message: "Cycle entry deleted" });
  } catch (err) {
    return next(err);
  }
});

// Delete all cycle entries for the authenticated user
router.delete("/", async (req, res, next) => {
  try {
    const result = await CycleEntry.deleteMany({ user: req.user._id });
    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} cycle entries`,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
