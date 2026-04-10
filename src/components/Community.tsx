import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Users,
  Trash2,
  MapPin,
  Calendar,
  Pencil,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  listPosts,
  createPost,
  updatePost,
  likePost,
  deletePost,
  addComment,
  deleteComment,
  getPublicProfile,
  type CommunityPost as PostType,
  type PublicUserProfile,
} from "@/lib/api";
import { isAuthenticated, getStoredUser } from "@/lib/auth";
import { UserAvatar } from "./UserAvatar";

const categoryOptions = ["Health", "Wellness", "Support", "Advice", "Career", "General"];

type FormatPreset = {
  label: string;
  before: string;
  after?: string;
  placeholder?: string;
};

const formatPresets: FormatPreset[] = [
  { label: "B", before: "**", after: "**", placeholder: "bold text" },
  { label: "I", before: "*", after: "*", placeholder: "italic text" },
  { label: "H", before: "## ", placeholder: "heading" },
  { label: "Quote", before: "> ", placeholder: "quoted text" },
  { label: "List", before: "- ", placeholder: "list item" },
  { label: "Code", before: "`", after: "`", placeholder: "code" },
];

function renderInlineFormatting(text: string) {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const tokens = text.split(tokenRegex).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong key={`b-${index}`}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return <code key={`c-${index}`} className="px-1 py-0.5 rounded bg-gray-100 text-[0.92em]">{token.slice(1, -1)}</code>;
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={`i-${index}`}>{token.slice(1, -1)}</em>;
    }
    return <React.Fragment key={`t-${index}`}>{token}</React.Fragment>;
  });
}

function renderFormattedContent(raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      nodes.push(<div key={`space-${i}`} className="h-2" />);
      i += 1;
      continue;
    }

    if (/^\s*##\s+/.test(line)) {
      nodes.push(
        <h3 key={`h-${i}`} className="text-base text-gray-900" style={{ fontWeight: 700 }}>
          {renderInlineFormatting(line.replace(/^\s*##\s+/, ""))}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      let quoteIndex = i;
      while (quoteIndex < lines.length && /^\s*>\s?/.test(lines[quoteIndex])) {
        quoteLines.push(lines[quoteIndex].replace(/^\s*>\s?/, ""));
        quoteIndex += 1;
      }

      nodes.push(
        <blockquote key={`q-${i}`} className="border-l-4 border-violet-300 bg-violet-50/80 px-3 py-2 rounded-md text-gray-700 italic space-y-1">
          {quoteLines.map((quoteLine, quoteLineIndex) => (
            <div key={`q-line-${i}-${quoteLineIndex}`}>{renderInlineFormatting(quoteLine)}</div>
          ))}
        </blockquote>,
      );
      i = quoteIndex;
      continue;
    }

    if (/^\s*[-*]\s?/.test(line)) {
      const items: string[] = [];
      let listIndex = i;
      while (listIndex < lines.length && /^\s*[-*]\s?/.test(lines[listIndex])) {
        items.push(lines[listIndex].replace(/^\s*[-*]\s?/, ""));
        listIndex += 1;
      }
      nodes.push(
        <div key={`ul-${i}`} className="text-gray-700 space-y-1">
          {items.map((item, itemIndex) => (
            <div key={`li-${i}-${itemIndex}`} className="flex items-start gap-2">
              <span className="leading-6 text-black" aria-hidden="true">•</span>
              <span className="leading-relaxed break-words">{renderInlineFormatting(item)}</span>
            </div>
          ))}
        </div>,
      );
      i = listIndex;
      continue;
    }

    nodes.push(
      <p key={`p-${i}`} className="text-sm text-gray-700 leading-relaxed break-words">
        {renderInlineFormatting(line)}
      </p>,
    );
    i += 1;
  }

  return <div className="space-y-1">{nodes}</div>;
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
  const [activeFilter, setActiveFilter] = useState("All");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<PublicUserProfile | null>(null);
  const composeRef = useRef<HTMLTextAreaElement | null>(null);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [updatingPost, setUpdatingPost] = useState(false);

  const user = getStoredUser();
  const userId = user?.id;

  const fetchPosts = async (category = activeFilter) => {
    try {
      const res = await listPosts(category);
      setPosts(res.data);
    } catch {
      setError("Could not load posts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(activeFilter); }, [activeFilter]);

  const handlePost = async () => {
    const normalized = newContent.replace(/\r\n/g, "\n");
    if (!normalized.trim()) return;
    setPosting(true);
    setError("");
    try {
      await createPost({ content: normalized, category: newCategory });
      setNewContent("");
      await fetchPosts(activeFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const applyFormat = (
    preset: FormatPreset,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    textarea: HTMLTextAreaElement | null,
  ) => {
    if (!textarea) return;

    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? 0;
    const selectedText = value.slice(selectionStart, selectionEnd);
    const isLinePrefixPreset = !preset.after && ["## ", "> ", "- "].includes(preset.before);

    let inserted = "";
    if (isLinePrefixPreset && selectedText) {
      inserted = selectedText
        .split(/\r?\n/)
        .map((line) => (line.trim() ? `${preset.before}${line}` : line))
        .join("\n");
    } else {
      inserted = `${preset.before}${selectedText || preset.placeholder || ""}${preset.after || ""}`;
    }

    const updated = `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`;

    setValue(updated);

    requestAnimationFrame(() => {
      const cursor = selectedText ? selectionStart + inserted.length : selectionStart + (preset.before.length + (preset.placeholder || "").length);
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const applyComposeFormat = (preset: FormatPreset) => {
    applyFormat(preset, newContent, setNewContent, composeRef.current);
  };

  const applyEditFormat = (preset: FormatPreset) => {
    applyFormat(preset, editContent, setEditContent, editRef.current);
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

  const openEditPost = (post: PostType) => {
    setEditingPostId(post._id);
    setEditContent(post.content.replace(/\\n/g, "\n"));
    setEditCategory(post.category || "General");
  };

  const handleUpdatePost = async () => {
    if (!editingPostId) return;
    const normalized = editContent.replace(/\r\n/g, "\n");
    if (!normalized.trim()) return;

    setUpdatingPost(true);
    try {
      const response = await updatePost(editingPostId, { content: normalized, category: editCategory });
      setPosts((prev) => prev.map((post) => (post._id === editingPostId ? response.data : post)));
      setEditingPostId(null);
      setEditContent("");
      setEditCategory("General");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const draft = (commentDrafts[postId] || "").replace(/\r\n/g, "\n");
    if (!draft.trim()) return;

    try {
      const res = await addComment(postId, draft);
      setPosts((prev) => prev.map((post) => (post._id === postId ? res.data : post)));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setCommentsOpen((prev) => ({ ...prev, [postId]: true }));
    } catch {
      setError("Failed to add comment");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const res = await deleteComment(postId, commentId);
      setPosts((prev) => prev.map((post) => (post._id === postId ? res.data : post)));
    } catch {
      setError("Failed to delete comment");
    }
  };

  const openProfile = async (authorId: string) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError("");
    setSelectedProfile(null);

    try {
      const response = await getPublicProfile(authorId);
      setSelectedProfile(response.data);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white mb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-violet-100 hover:text-white">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
            <Users className="w-5 h-5" />
            <h1 className="text-2xl" style={{ fontWeight: 700 }}>Community</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 mb-10">
        {/* Compose */}
        {isAuthenticated() ? (
          <Card className="border-violet-200 mb-10">
            <CardContent className="space-y-3 py-6">
              <Textarea
                ref={composeRef}
                placeholder="Share something with the community…"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[56px] resize-none text-sm"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {formatPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => applyComposeFormat(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <span className="text-[11px] text-gray-500">Formatting supports mini tweets and long-form notes.</span>
              </div>
              <div className="flex items-center justify-between">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-sm border rounded-lg px-2.5 py-1.5 bg-white h-9"
                >
                  {categoryOptions.map((c) => <option key={c}>{c}</option>)}
                </select>
                <Button
                  size="sm"
                  disabled={posting || !newContent.trim()}
                  className="bg-violet-600 hover:bg-violet-700 h-9"
                  onClick={handlePost}
                >
                  <Send className="w-4 h-4 mr-1" />{posting ? "Posting…" : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-violet-200 bg-violet-50 mb-6">
            <CardContent className="py-3 text-center">
              <p className="text-sm text-gray-600 mb-2">Log in to share posts</p>
              <Button size="sm" onClick={() => navigate("/login")} className="bg-violet-600 hover:bg-violet-700">Login</Button>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        <Card className="border-violet-200 mb-3">
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-gray-700">Filter posts</p>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="text-sm border rounded-lg px-2.5 py-1.5 bg-white h-9"
              >
                {[
                  "All",
                  ...categoryOptions,
                ].map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No posts yet. Be the first!</p>
        ) : (
          posts.map((post) => (
            <Card key={post._id} className="hover:shadow-sm transition-shadow mt-4">
              <CardContent className="py-6 space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => openProfile(post.author)}
                    className="flex items-center gap-3 min-w-0 text-left flex-1"
                  >
                    <UserAvatar
                      name={post.authorName}
                      imageUrl={post.authorAvatarUrl}
                      seed={post.author}
                      className="w-9 h-9 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ fontWeight: 600 }}>{post.authorName}</p>
                      <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">{post.category}</Badge>
                  </div>
                </div>
                {renderFormattedContent(post.content.replace(/\\n/g, "\n"))}
                <div className="flex items-center gap-2 py-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleLike(post._id)}
                    className={post.likedBy.includes(userId || "") ? "text-pink-600 h-8" : "h-8"}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${post.likedBy.includes(userId || "") ? "fill-pink-600" : ""}`} />
                    {post.likes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentsOpen((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                    className="h-8"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />{post.comments?.length || 0}
                  </Button>
                  {post.author === userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditPost(post)}
                      className="text-gray-400 hover:text-violet-700 h-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {post.author === userId && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post._id)} className="text-gray-400 hover:text-red-600 ml-auto h-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {commentsOpen[post._id] && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="space-y-1.5">
                      {(post.comments || []).length === 0 ? (
                        <p className="text-xs text-gray-400">No comments yet.</p>
                      ) : (
                        (post.comments || []).map((comment) => (
                          <div key={comment._id} className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <button onClick={() => openProfile(comment.author)}>
                                <UserAvatar
                                  name={comment.authorName}
                                  imageUrl={comment.authorAvatarUrl}
                                  seed={comment.author}
                                  className="w-7 h-7 flex-shrink-0"
                                />
                              </button>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{comment.authorName}</p>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{comment.content.replace(/\\n/g, "\n")}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(comment.createdAt)}</p>
                              </div>
                            </div>
                            {(comment.author === userId || post.author === userId) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-red-600 h-7 flex-shrink-0"
                                onClick={() => handleDeleteComment(post._id, comment._id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {isAuthenticated() && (
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Write a comment…"
                          value={commentDrafts[post._id] || ""}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                          className="min-h-[40px] resize-none text-sm"
                        />
                        <Button
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-700 self-end h-10"
                          onClick={() => handleAddComment(post._id)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile</DialogTitle>
              <DialogDescription>
                Minimal profile details are shown to protect member privacy.
              </DialogDescription>
            </DialogHeader>

            {profileLoading && <p className="text-sm text-gray-500">Loading profile...</p>}
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}

            {!profileLoading && selectedProfile && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={selectedProfile.name}
                    imageUrl={selectedProfile.avatarUrl}
                    seed={selectedProfile._id}
                    className="w-12 h-12 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-base truncate" style={{ fontWeight: 700 }}>{selectedProfile.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(selectedProfile.memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border px-2.5 py-2 bg-gray-50">
                    <p className="text-xs text-gray-500">Posts</p>
                    <p style={{ fontWeight: 600 }}>{selectedProfile.postsCount}</p>
                  </div>
                  <div className="rounded-lg border px-2.5 py-2 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                    <p className="flex items-center gap-1 text-sm" style={{ fontWeight: 600 }}>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{selectedProfile.city || "Not shared"}</span>
                    </p>
                  </div>
                </div>

                {selectedProfile.bio && (
                  <div className="rounded-lg border px-2.5 py-2 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">About</p>
                    <p className="text-sm text-gray-700">{selectedProfile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(editingPostId)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPostId(null);
              setEditContent("");
              setEditCategory("General");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>Update your post content and category.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                ref={editRef}
                placeholder="Update your post..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px] resize-none text-sm"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {formatPresets.map((preset) => (
                  <Button
                    key={`edit-${preset.label}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => applyEditFormat(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="text-sm border rounded-lg px-2.5 py-1.5 bg-white h-9"
                >
                  {categoryOptions.map((c) => <option key={`edit-option-${c}`}>{c}</option>)}
                </select>
                <Button
                  type="button"
                  className="bg-violet-600 hover:bg-violet-700"
                  disabled={updatingPost || !editContent.trim()}
                  onClick={handleUpdatePost}
                >
                  {updatingPost ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
