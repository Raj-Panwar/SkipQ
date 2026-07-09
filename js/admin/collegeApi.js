// js/admin/collegeApi.js
// NEW FILE — thin wrapper around the EXISTING backend endpoint
// GET /api/colleges/code/{code} (see CollegeController.java).
// No backend/API changes: this simply gives the admin SPA a way to
// read the college's display name for the header + Dashboard's
// "College Information" card, following the same fetch pattern
// already used in productApi.js / adminApi.js.

const COLLEGES_URL = "http://localhost:8080/api/colleges";

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
  } catch (_networkError) {
    throw new Error("Unable to reach the server. Check your connection.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * GET /api/colleges/code/{code}
 * @param {string} code
 * @returns {Promise<{id, name, code, domain, logoUrl, contactEmail,
 *   contactPhone, address, city, state, country, active,
 *   createdAt, updatedAt}>}
 */
export function getCollegeByCode(code) {
  return request(`${COLLEGES_URL}/code/${encodeURIComponent(code)}`);
}