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
 * POST /api/students/register/verify-otp
 * @param {{ email, collegeCode, otp }} payload
 * @returns {{ id, fullName, email, phoneNumber, collegeCode }}
 */
export function verifyRegisterOtp(payload) {
  return request(`${BASE_URL}/register/verify-otp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/students/register/resend-otp
 * @param {{ email, collegeCode }} payload
 * @returns {{ message, expiresInSeconds }}
 */
export function resendRegisterOtp(payload) {
  return request(`${BASE_URL}/register/resend-otp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/students/forgot-password
 * Always resolves with a generic success message.
 * @param {{ email, collegeCode }} payload
 */
export function forgotPassword(payload) {
  return request(`${BASE_URL}/forgot-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/students/forgot-password/resend-otp
 * @param {{ email, collegeCode }} payload
 * @returns {{ message, expiresInSeconds }}
 */
export function resendResetOtp(payload) {
  return request(`${BASE_URL}/forgot-password/resend-otp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/students/forgot-password/verify-otp
 * Verifies without consuming the OTP.
 * @param {{ email, collegeCode, otp }} payload
 */
export function verifyResetOtp(payload) {
  return request(`${BASE_URL}/forgot-password/verify-otp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/students/reset-password
 * Re-validates and consumes the OTP, then updates the password.
 * @param {{ email, collegeCode, otp, newPassword }} payload
 */
export function resetPassword(payload) {
  return request(`${BASE_URL}/reset-password`, {
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