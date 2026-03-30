const express = require("express");
const mongoose = require("mongoose");
const SOSAlert = require("../models/sosAlert");
const { authMiddleware } = require("./auth");

const router = express.Router();

function ensureDB(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: "Database not connected" });
  }
  return next();
}

router.use(ensureDB);

// Trigger SOS — stores user location so nearby users/services can be notified
router.post("/trigger", authMiddleware, async (req, res, next) => {
  try {
    const { longitude, latitude, message } = req.body;

    if (longitude == null || latitude == null) {
      return res.status(400).json({
        success: false,
        message: "longitude and latitude are required",
      });
    }

    const alert = await SOSAlert.create({
      user: req.user._id,
      userName: req.user.name,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      message: message || "I need help immediately!",
    });

    return res.status(201).json({ success: true, data: alert });
  } catch (err) {
    return next(err);
  }
});

// Get active SOS alerts near a location (public — so nearby users can respond)
// Query: ?longitude=X&latitude=Y&radiusKm=5
router.get("/nearby", async (req, res, next) => {
  try {
    const { longitude, latitude, radiusKm } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "longitude and latitude query params are required",
      });
    }

    const radius = Number(radiusKm) || 5; // default 5 km

    const alerts = await SOSAlert.find({
      active: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: radius * 1000, // convert km to meters
        },
      },
    }).limit(20);

    return res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    return next(err);
  }
});

// Resolve / deactivate own SOS
router.post("/:id/resolve", authMiddleware, async (req, res, next) => {
  try {
    const alert = await SOSAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    if (!alert.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    alert.active = false;
    alert.resolvedAt = new Date();
    await alert.save();
    return res.json({ success: true, data: alert });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
