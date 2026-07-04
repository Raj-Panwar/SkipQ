// js/student/orderApi.js

const BASE_URL = "http://localhost:8080/api/orders";

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

export function getOrders() {
  return request(BASE_URL);
}


export async function getOrderById(id) {
  const response = await fetch(
    `http://localhost:8080/api/orders/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to load order");
  }

  return response.json();
}
export async function getQueueInfo(id) {

  const response = await fetch(
      `http://localhost:8080/api/orders/${id}/queue`
  );

  if (!response.ok)
      throw new Error("Failed to load queue");

  return response.json();
  
}
export function getStudentOrders(studentId) {
  return request(`${BASE_URL}/student/${studentId}`);
}
export function getCurrentServingToken() {
    return request(`${BASE_URL}/queue/current-serving`);
}
export function getCurrentWaitEstimate() {
    return request(`${BASE_URL}/wait-estimate`);
}
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