// js/student/orderApi.js
import { getToken } from "../shared/auth.js";

const BASE_URL = "http://localhost:8080/api/orders";

async function request(url, options = {}) {
  let response;

  const token = getToken();

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

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function createOrder(orderData) {
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

// Admin-only (list all orders for the admin's college). Kept here for
// backward compatibility since nothing currently imports it, but if you
// need this from an admin page, prefer js/admin/adminApi.js instead.
export function getOrders() {
  return request(BASE_URL);
}

export function getOrderById(id) {
  return request(`${BASE_URL}/${id}`);
}
export function getQueueInfo(id) {
  return request(`${BASE_URL}/${id}/queue`);
}

/** The student's own order history. Identity comes from the JWT — no id needed. */
export function getStudentOrders() {
  return request(`${BASE_URL}/student/me`);
}

export function getCurrentServingToken() {
  return request(`${BASE_URL}/queue/current-serving`);
}

export function getPreLoginQueue(collegeCode) {
  return request(`${BASE_URL}/queue/college/${encodeURIComponent(collegeCode)}`);
}

export function getCurrentWaitEstimate() {
  return request(`${BASE_URL}/wait-estimate`);
}

// Admin-only search/filter across the college's orders.
export function searchOrders({
  query = "",
  status = "",
  date = "",
  sort = "newest",
  page = 0,
  size = 20,
} = {}) {
  const params = new URLSearchParams();

  if (query) params.append("query", query);
  if (status) params.append("status", status);
  if (date) params.append("date", date);

  params.append("sort", sort);
  params.append("page", page);
  params.append("size", size);

  return request(`${BASE_URL}/search?${params.toString()}`);
}

/** Cancels the caller's own order. Ownership is enforced server-side from the JWT. */
export function cancelOrder(orderId) {
  return request(`${BASE_URL}/${orderId}/cancel`, {
    method: "PUT",
  });
}

/** The student's own active order. Identity comes from the JWT — no id needed. */
export function getActiveOrder() {
  return request(`${BASE_URL}/student/me/active`);
}