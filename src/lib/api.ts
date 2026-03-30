import { getAuthToken } from "./auth";

// ─── Types ───────────────────────────────────────────────────
export type HealthResponse = {
  success: boolean;
  message: string;
  database?: { connected: boolean; state: number };
  timestamp: string;
};

export type AuthPayload = {
  success: boolean;
  message: string;
  token: string;
  data: { id: string; name: string; email: string };
};

export type CommunityPost = {
  _id: string;
  author: string;
  authorName: string;
  category: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
};

export type SOSAlert = {
  _id: string;
  user: string;
  userName: string;
  location: { type: string; coordinates: [number, number] };
  message: string;
  active: boolean;
  createdAt: string;
};

export type CycleEntry = {
  _id: string;
  user: string;
  periodStartDate: string;
  periodEndDate: string;
  flowLevel: "light" | "medium" | "heavy";
  createdAt: string;
  updatedAt: string;
};

// ─── Fetch helper ────────────────────────────────────────────
type ApiOptions = { method?: string; body?: unknown };

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const token = getAuthToken();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload as T;
}

// ─── Health ──────────────────────────────────────────────────
export function getHealthStatus() {
  return apiRequest<HealthResponse>("/api/v1/health");
}

// ─── Auth ────────────────────────────────────────────────────
export function registerUser(input: { name: string; email: string; password: string }) {
  return apiRequest<AuthPayload>("/api/v1/auth/register", { method: "POST", body: input });
}

export function loginUser(input: { email: string; password: string }) {
  return apiRequest<AuthPayload>("/api/v1/auth/login", { method: "POST", body: input });
}

export function getCurrentUser() {
  return apiRequest<{ success: boolean; data: { _id: string; name: string; email: string } }>(
    "/api/v1/auth/me",
  );
}

export function logoutUser() {
  return apiRequest<{ success: boolean; message: string }>("/api/v1/auth/logout", { method: "POST" });
}

// ─── Community Posts ─────────────────────────────────────────
export function listPosts() {
  return apiRequest<{ success: boolean; count: number; data: CommunityPost[] }>("/api/v1/posts");
}

export function createPost(input: { content: string; category?: string }) {
  return apiRequest<{ success: boolean; data: CommunityPost }>("/api/v1/posts", {
    method: "POST",
    body: input,
  });
}

export function likePost(id: string) {
  return apiRequest<{ success: boolean; data: CommunityPost }>(`/api/v1/posts/${id}/like`, {
    method: "POST",
  });
}

export function deletePost(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/api/v1/posts/${id}`, {
    method: "DELETE",
  });
}

// ─── SOS Alerts ──────────────────────────────────────────────
export function triggerSOS(input: { longitude: number; latitude: number; message?: string }) {
  return apiRequest<{ success: boolean; data: SOSAlert }>("/api/v1/sos/trigger", {
    method: "POST",
    body: input,
  });
}

export function getNearbyAlerts(longitude: number, latitude: number, radiusKm = 5) {
  return apiRequest<{ success: boolean; count: number; data: SOSAlert[] }>(
    `/api/v1/sos/nearby?longitude=${longitude}&latitude=${latitude}&radiusKm=${radiusKm}`,
  );
}

export function resolveSOS(id: string) {
  return apiRequest<{ success: boolean; data: SOSAlert }>(`/api/v1/sos/${id}/resolve`, {
    method: "POST",
  });
}

// ─── Cycle Entries ───────────────────────────────────────────
export function listCycleEntries() {
  return apiRequest<{ success: boolean; count: number; data: CycleEntry[] }>("/api/v1/cycle-entries");
}

export function createCycleEntry(input: {
  periodStartDate: string;
  periodEndDate: string;
  flowLevel: "light" | "medium" | "heavy";
}) {
  return apiRequest<{ success: boolean; data: CycleEntry }>("/api/v1/cycle-entries", {
    method: "POST",
    body: input,
  });
}

export function deleteCycleEntry(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/api/v1/cycle-entries/${id}`, {
    method: "DELETE",
  });
}
