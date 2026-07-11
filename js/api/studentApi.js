// js/api/studentApi.js
// NEW FILE — fetch client for Student auth and profile endpoints.
// Follows the same pattern as productApi.js and orderApi.js so the
// codebase stays consistent.

const BASE_URL = "http://localhost:8080/api/students";

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
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
 * POST /api/students/register
 * @param {{ fullName, email, phoneNumber, password }} payload
 * @returns {{ id, fullName, email, phoneNumber }}
 */
export function registerStudent(payload) {
  return request(`${BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/students/login
 * @param {{ email, password }} payload
 * @returns {{ id, fullName, email, phoneNumber }}
 */
export function loginStudent(payload) {
  return request(`${BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/students/{id}
 * @param {number} id
 */
export function getStudentProfile(id) {
  return request(`${BASE_URL}/${id}`);
}
/**
 * PUT /api/students/{id}
 * Updates only the editable profile fields (full name, phone number).
 * @param {number} id
 * @param {{ fullName: string, phoneNumber: string }} payload
 */
export function updateStudentProfile(id, payload) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
/**
 * GET /api/students/{id}/orders
 * @param {number} id
 */
export function getStudentOrders(id) {
  return request(`${BASE_URL}/${id}/orders`);
}