// js/student/userStore.js
// Small sessionStorage-backed cache for the logged-in student's profile.
// Lets the Profile page paint instantly from cache while the fresh
// GET /api/students/{id} request is in flight, and keeps the cached
// copy in sync after a successful "Save changes".

const PROFILE_CACHE_KEY = "skipq_profile_cache";

/** @returns {object|null} the cached profile, or null if none is stored */
export function getCachedProfile() {
  const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** @param {object} profile */
export function setCachedProfile(profile) {
  sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
}

export function clearCachedProfile() {
  sessionStorage.removeItem(PROFILE_CACHE_KEY);
}