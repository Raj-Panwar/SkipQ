// js/api/authApi.js
// Wraps /auth/register and /auth/login.

import { request } from "./apiClient.js";

/**
 * Register a new student account.
 * @param {{ name: string, email: string, rollNumber: string, password: string }} payload
 * @returns {Promise<{ id: number, name: string, email: string, role: string }>}
 */
export function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: payload,
  });
}

/**
 * Log in and receive a JWT.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ token: string, tokenType: string, expiresIn: number, user: object }>}
 */
export function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload,
  });
}