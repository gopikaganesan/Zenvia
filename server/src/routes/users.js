const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/user");
const CommunityPost = require("../models/communityPost");

const router = express.Router();

function ensureDB(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: "Database not connected" });
  }
  return next();
}

router.use(ensureDB);

router.get("/:id/public", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name avatarUrl city bio createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const postsCount = await CommunityPost.countDocuments({ author: user._id });

    return res.json({
      success: true,
      data: {
        _id: String(user._id),
        name: user.name,
        avatarUrl: user.avatarUrl || "",
        city: user.city || "",
        bio: user.bio || "",
        memberSince: user.createdAt,
        postsCount,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
