import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Users,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { listPosts, createPost, likePost, deletePost, type CommunityPost as PostType } from "@/lib/api";
import { isAuthenticated, getStoredUser } from "@/lib/auth";

const categoryOptions = ["Health", "Wellness", "Support", "Advice", "Career", "General"];

const avatarColors = [
  "from-violet-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-green-500",
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Community() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const user = getStoredUser();
  const userId = user?.id;

  const fetchPosts = async () => {
    try {
      const res = await listPosts();
      setPosts(res.data);
    } catch {
      setError("Could not load posts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    setError("");
    try {
      await createPost({ content: newContent.trim(), category: newCategory });
      setNewContent("");
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await likePost(id);
      setPosts((prev) => prev.map((p) => (p._id === id ? res.data : p)));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-violet-100 hover:text-white mb-3">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <h1 className="text-2xl" style={{ fontWeight: 700 }}>Community</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Compose */}
        {isAuthenticated() ? (
          <Card className="border-violet-200">
            <CardContent className="pt-5 space-y-3">
              <Textarea
                placeholder="Share something with the community…"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1.5 bg-white"
                >
                  {categoryOptions.map((c) => <option key={c}>{c}</option>)}
                </select>
                <Button
                  size="sm"
                  disabled={posting || !newContent.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handlePost}
                >
                  <Send className="w-4 h-4 mr-1" />{posting ? "Posting…" : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-violet-200 bg-violet-50">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Log in to share posts</p>
              <Button size="sm" onClick={() => navigate("/login")} className="bg-violet-600 hover:bg-violet-700">Login</Button>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        {/* Posts */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No posts yet. Be the first!</p>
        ) : (
          posts.map((post, idx) => (
            <Card key={post._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className={`bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} text-white text-xs`}>
                      {initials(post.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 600 }}>{post.authorName}</p>
                    <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{post.category}</Badge>
                </div>
                <p className="text-sm text-gray-700">{post.content}</p>
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleLike(post._id)}
                    className={post.likedBy.includes(userId || "") ? "text-pink-600" : ""}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${post.likedBy.includes(userId || "") ? "fill-pink-600" : ""}`} />
                    {post.likes}
                  </Button>
                  {post.author === userId && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post._id)} className="text-gray-400 hover:text-red-600 ml-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
