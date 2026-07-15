// js/api/studentApi.js
// fetch client for Student auth and profile endpoints.
// Follows the same pattern as productApi.js and orderApi.js so the
// codebase stays consistent.

import { getToken } from "../shared/auth.js";

const BASE_URL = "http://localhost:8080/api/students";

async function request(url, options = {}) {
  const token = getToken();

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
 * POST /api/students/register
 * @param {{ fullName, email, phoneNumber, password, collegeCode }} payload
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
 * @param {{ collegeCode, email, password }} payload
 * @returns {{ id, fullName, email, phoneNumber, collegeCode, token }}
 */
export function loginStudent(payload) {
  return request(`${BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/students/me
 * Identity comes from the JWT — no id needed.
 */
export function getStudentProfile() {
  return request(`${BASE_URL}/me`);
}

/**
 * PUT /api/students/me
 * Updates only the editable profile fields (full name, phone number).
 * @param {{ fullName: string, phoneNumber: string }} payload
 */
export function updateStudentProfile(payload) {
  return request(`${BASE_URL}/me`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}