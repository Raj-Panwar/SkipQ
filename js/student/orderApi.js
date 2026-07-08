
// js/student/orderApi.js
import { getSession } from "../shared/auth.js";

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


export function getOrderById(id) {
  return request(`${BASE_URL}/${id}`);
}
export function getQueueInfo(id) {
  return request(`${BASE_URL}/${id}/queue`);
}
export function getStudentOrders(studentId) {
  return request(`${BASE_URL}/student/${studentId}`);
}
export function getCurrentServingToken() {

    const student = getSession();

    return request(
        `${BASE_URL}/queue/current-serving?studentId=${student.id}`
    );
}

export function getPreLoginQueue(collegeCode) {
  return request(`${BASE_URL}/queue/college/${encodeURIComponent(collegeCode)}`);
}

export function getCurrentWaitEstimate() {

    const student = getSession();

    return request(
        `${BASE_URL}/wait-estimate?studentId=${student.id}`
    );
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
export function cancelOrder(orderId, studentId) {
  return request(
    `${BASE_URL}/${orderId}/cancel?studentId=${studentId}`,
    {
      method: "PUT",
    }
  );
}

export function getActiveOrder(studentId) {
  return request(`${BASE_URL}/student/${studentId}/active`);
}
