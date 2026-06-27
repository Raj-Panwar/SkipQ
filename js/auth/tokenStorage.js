// js/auth/tokenStorage.js
// Centralized read/write/clear of the JWT and basic user info in localStorage.
// Keeping these keys in one place avoids typos scattered across pages.

const TOKEN_KEY = "skipq_token";
const USER_KEY = "skipq_user";

/** @returns {string|null} the stored JWT, or null if not logged in */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** @param {string} token */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** @returns {{ id: number, name: string, role: string } | null} */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** @param {object} user */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Clears both token and user — used on logout. */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** @returns {boolean} true if a token is present */
export function isAuthenticated() {
  return Boolean(getUser());
}