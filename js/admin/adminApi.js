// js/admin/adminApi.js

const ORDERS_URL = "http://localhost:8080/api/orders";

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

/**
 * GET /api/orders
 * @returns {Promise<Array>}
 */
export function getAllOrders() {
  return request(ORDERS_URL);
}

/**
 * Fetches all orders and derives dashboard stat values from them.
 * No separate stats endpoint exists — computed client-side from the
 * full order list, same approach as inventoryPage.js with products.
 *
 * @returns {Promise<{
 *   totalOrdersToday: number,
 *   activeTokens: number,
 *   pendingPrintJobs: number,
 *   revenueToday: number,
 *   orders: Array
 * }>}
 */
export async function getDashboardStats() {
  const orders = await getAllOrders();

  const todayStr = new Date().toDateString();

  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === todayStr
  );

  const activeTokens = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  ).length;

  const pendingPrintJobs = orders
    .flatMap((o) => o.items ?? [])
    .filter((item) => item.itemType === "print").length;

  const revenueToday = todayOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  return {
    totalOrdersToday: todayOrders.length,
    activeTokens,
    pendingPrintJobs,
    revenueToday,
    orders,
  };
}

export async function updateOrderStatus(orderId, status) {
  return request(
    `${ORDERS_URL}/${orderId}/status?status=${status}`,
    {
      method: "PATCH"
    }
  );
}