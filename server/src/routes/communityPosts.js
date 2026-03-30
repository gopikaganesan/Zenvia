const express = require("express");
const mongoose = require("mongoose");
const CommunityPost = require("../models/communityPost");
const { authMiddleware } = require("./auth");

const router = express.Router();

function ensureDB(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: "Database not connected" });
  }
  return next();
}

router.use(ensureDB);

// List posts (public)
router.get("/", async (req, res, next) => {
  try {
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    return next(err);
  }
});

// Create post (auth required)
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { content, category } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }
    const post = await CommunityPost.create({
      author: req.user._id,
      authorName: req.user.name,
      category: category || "General",
      content: content.trim(),
    });
    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    return next(err);
  }
});

// Like / unlike
router.post("/:id/like", authMiddleware, async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const uid = req.user._id;
    const alreadyLiked = post.likedBy.some((id) => id.equals(uid));

    if (alreadyLiked) {
      post.likedBy.pull(uid);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(uid);
      post.likes += 1;
    }
    await post.save();
    return res.json({ success: true, data: post });
  } catch (err) {
    return next(err);
  }
});

// Delete own post
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await post.deleteOne();
    return res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
