const express = require("express");
const mongoose = require("mongoose");
const CommunityPost = require("../models/communityPost");
const User = require("../models/user");
const { authMiddleware } = require("./auth");

const router = express.Router();

function ensureDB(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: "Database not connected" });
  }
  return next();
}

router.use(ensureDB);

async function enrichPosts(posts) {
  const userIds = new Set();

  posts.forEach((post) => {
    const rawPost = typeof post.toObject === "function" ? post.toObject() : post;
    if (rawPost.author) {
      userIds.add(String(rawPost.author));
    }
    (rawPost.comments || []).forEach((comment) => {
      if (comment.author) {
        userIds.add(String(comment.author));
      }
    });
  });

  const users = await User.find({ _id: { $in: Array.from(userIds) } })
    .select("name avatarUrl")
    .lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return posts.map((post) => {
    const rawPost = typeof post.toObject === "function" ? post.toObject() : post;
    const author = userMap.get(String(rawPost.author));

    return {
      ...rawPost,
      authorName: author?.name || rawPost.authorName,
      authorAvatarUrl: author?.avatarUrl || "",
      comments: (rawPost.comments || []).map((comment) => {
        const commentAuthor = userMap.get(String(comment.author));
        return {
          ...comment,
          authorName: commentAuthor?.name || comment.authorName,
          authorAvatarUrl: commentAuthor?.avatarUrl || "",
        };
      }),
    };
  });
}

// List posts (public)
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const posts = await CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
    const enrichedPosts = await enrichPosts(posts);
    return res.json({ success: true, count: enrichedPosts.length, data: enrichedPosts });
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
    const [enrichedPost] = await enrichPosts([post]);
    return res.status(201).json({ success: true, data: enrichedPost });
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
    const [enrichedPost] = await enrichPosts([post]);
    return res.json({ success: true, data: enrichedPost });
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

// Add comment on post
router.post("/:id/comments", authMiddleware, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({
      author: req.user._id,
      authorName: req.user.name,
      content: content.trim(),
    });

    await post.save();
    const [enrichedPost] = await enrichPosts([post]);
    return res.status(201).json({ success: true, data: enrichedPost });
  } catch (err) {
    return next(err);
  }
});

// Delete comment (comment author or post author)
router.delete("/:id/comments/:commentId", authMiddleware, async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const canDelete = comment.author.equals(req.user._id) || post.author.equals(req.user._id);
    if (!canDelete) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();
    const [enrichedPost] = await enrichPosts([post]);
    return res.json({ success: true, data: enrichedPost });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
