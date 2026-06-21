// js/api/apiClient.js
// Thin fetch wrapper: prefixes the API base URL, injects the JWT
// Authorization header when present, and normalizes error handling.

import { getToken } from "../auth/tokenStorage.js";

const API_BASE_URL = "http://localhost:8080/api/v1";

/**
 * Custom error type carrying the HTTP status and parsed response body,
 * so callers can branch on status codes (e.g. 401 -> redirect to login).
 */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Core request function used by all api/*Api.js modules.
 * @param {string} path - path relative to API_BASE_URL, e.g. "/auth/login"
 * @param {object} [options]
 * @param {string} [options.method="GET"]
 * @param {object} [options.body] - JSON-serializable request body
 * @param {boolean} [options.auth=false] - if true, attach Bearer token
 * @returns {Promise<any>} parsed JSON response (or null for empty responses)
 */
export async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError("Unable to reach the server. Check your connection.", 0, null);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  return data;
}