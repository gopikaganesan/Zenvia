export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

const TOKEN_KEY = "zenvia_auth_token";
const USER_KEY = "zenvia_auth_user";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

export function setAuthSession(token: string, user: AuthUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function updateStoredUser(patch: Partial<AuthUser>) {
  try {
    const current = getStoredUser();
    if (!current) return;
    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}
