// js/admin/adminDashboardPage.js
//
// Fully connected to the real backend via adminApi.js.
// adminStore.js is no longer imported. No mock/seed data is used.
// All orders and print jobs come from GET /api/orders.
// order.tokenNumber is used directly — no derivation from order.id.

import {
  getDashboardStats,
  updateOrderStatus,
  searchOrders
} from "./adminApi.js";

import { getLowStockProducts } from "./productApi.js";
import { renderPagination } from "../shared/pagination.js";
import { showToast } from "../shared/toast.js";
const FILE_API = "http://localhost:8080/api/files";
const ADMIN_SESSION_KEY = "skipq_admin_session";

if (!sessionStorage.getItem(ADMIN_SESSION_KEY)) {
  window.location.href = "./login.html";
}

// Stat card elements
const statOrdersEl = document.getElementById("statOrdersToday");
const statTokensEl = document.getElementById("statActiveTokens");
const statPrintEl = document.getElementById("statPendingPrint");
const statRevenueEl = document.getElementById("statRevenue");

const lowStockAlertsEl = document.getElementById("lowStockAlerts");
// Table bodies
const ordersTableBody = document.getElementById("ordersTableBody");
const ordersPageInfo = document.getElementById("ordersPageInfo");
const printTableBody = document.getElementById("printTableBody");

// Header buttons
const refreshBtn = document.getElementById("refreshBtn");
const logoutAdminBtn = document.getElementById("logoutAdminBtn");

//Search Buttons
const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const orderDateFilter = document.getElementById("orderDateFilter");
const orderSortFilter = document.getElementById("orderSortFilter");

let refreshInterval = null;
let searchTimeout = null;

const filters = {
  query: "",
  status: "",
  date: "",
  sort: "newest",
  page: 0,
  size: 15,
};
let currentOrdersPage = null;

init();

function init() {
  renderAll();
  startAutoRefresh();

  refreshBtn.addEventListener("click", () => {
    renderAll();
    showToast("Dashboard refreshed", "info", 2000);
  });

  logoutAdminBtn.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showToast("Logged out", "info", 1200);
    setTimeout(() => { window.location.href = "./login.html"; }, 900);
  });
  orderSearchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      filters.query = orderSearchInput.value.trim();
      filters.page = 0;
      performSearch();
    }, 400);
  });

  orderStatusFilter.addEventListener("change", () => {
    filters.status = orderStatusFilter.value;
    filters.page = 0;
    performSearch();
  });

  orderDateFilter.addEventListener("change", () => {
    filters.date = orderDateFilter.value;
    filters.page = 0;
    performSearch();
  });

  orderSortFilter.addEventListener("change", () => {
    filters.sort = orderSortFilter.value;
    filters.page = 0;
    performSearch();
  });

  ordersTableBody.addEventListener("click", handleOrderAction);
  printTableBody.addEventListener("click", handlePrintAction);
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------

async function renderAll() {
  setTablesLoading();

  let stats;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    showToast("Unable to load dashboard data", "error");
    setTablesError();
    return;
  }

  renderStats(stats);

await loadOrders();

await loadLowStockAlerts();

renderPrintTable(stats.orders);
}
async function loadLowStockAlerts() {

  try {

    const products = await getLowStockProducts();

    if (products.length === 0) {
      lowStockAlertsEl.innerHTML = `
    <div class="low-stock-empty">
        🎉 All products are sufficiently stocked.
    </div>
`;
      return;
    }

    lowStockAlertsEl.innerHTML = products
      .map(product => {

    const isOut = product.stockStatus === "OUT_OF_STOCK";

    return `
        <div class="low-stock-item ${isOut ? "low-stock-danger" : "low-stock-warning"}">

            <div class="low-stock-info">
                <div class="low-stock-name">${product.name}</div>
                <div class="low-stock-count">
                    ${isOut ? "Restock immediately" : `Only ${product.stock} units remaining`}
                </div>
            </div>

            <span class="badge ${isOut ? "badge-cancelled" : "badge-warning"}">
                ${isOut ? "Out of Stock" : "Low Stock"}
            </span>

        </div>
    `;
}).join("");

  } catch (error) {

    lowStockAlertsEl.innerHTML =
      "<p>Unable to load low stock alerts.</p>";

  }
}
async function loadOrders() {

  setTablesLoading();

  try {

    const page = await searchOrders(filters);

    currentOrdersPage = page;

    renderOrdersTable(page.content);
    renderPageInfo(page);
    renderPagination(
    "ordersPagination",
    page,
    (newPage) => {
        filters.page = newPage;
        loadOrders();
    }
);

  } catch (error) {

    showToast(error.message, "error");

    setTablesError();
  }

}
async function performSearch() {

  const hasFilters =
    filters.query ||
    filters.status ||
    filters.date ||
    filters.sort !== "newest";

  if (!hasFilters) {
    renderAll();
    return;
  }

  setTablesLoading();

  try {

    const page = await searchOrders(filters);

    renderOrdersTable(page.content);
    

  } catch (error) {

    showToast(error.message, "error");
    setTablesError();

  }
}
// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------

function renderStats(stats) {
  animateCount(statOrdersEl, stats.totalOrdersToday);
  animateCount(statTokensEl, stats.activeTokens);
  animateCount(statPrintEl, stats.pendingPrintJobs);
  statRevenueEl.textContent = formatCurrency(stats.revenueToday);
}

function animateCount(el, target) {
  const start = Number(el.textContent) || 0;
  if (start === target) return;
  const duration = 500;
  const t0 = performance.now();
  function step(now) {
    const t = Math.min((now - t0) / duration, 1);
    el.textContent = Math.round(start + (target - start) * t);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// Orders table
// ---------------------------------------------------------------------------

function renderOrdersTable(orders) {
  if (!orders || orders.length === 0) {
    ordersTableBody.innerHTML = `
      <tr class="table-empty">
        <td colspan="7">No orders yet.</td>
      </tr>`;
    return;
  }

  ordersTableBody.replaceChildren(
    ...orders.map(buildOrderRow)
);
}
function renderPageInfo(page) {

  if (!page) {
    ordersPageInfo.textContent = "";
    return;
  }

  const start = page.totalElements === 0
    ? 0
    : page.number * page.size + 1;

  const end = Math.min(
    (page.number + 1) * page.size,
    page.totalElements
  );

 ordersPageInfo.innerHTML = `
    <b>${page.totalElements}</b>Orders
    •
    Showing<b>${start}-${end}</b>
    •
    Page<b>${page.number + 1}</b> of <b>${page.totalPages}</b>
`;
}

function buildOrderRow(order) {
  const tr = document.createElement("tr");
  tr.dataset.orderId = String(order.id);

  const isTerminal =
    order.status === "COMPLETED" || order.status === "CANCELLED";

  tr.innerHTML = `
    <td class="table-cell">
      <span class="admin-token">#${order.tokenNumber}</span>
    </td>
    <td class="table-cell">
      <div class="table-student">
        <span class="table-student-name">${order.studentName ?? "—"}</span>
      </div>
    </td>
    <td class="table-cell table-items">
      ${buildItemsSummary(order.items)}
    </td>
    <td class="table-cell">
      <span class="admin-amount">${formatCurrency(order.totalAmount)}</span>
    </td>
    <td class="table-cell">
      <span class="badge ${statusBadgeClass(order.status)}">${order.status}</span>
    </td>
    <td class="table-cell table-time">
      ${formatTime(order.createdAt)}
    </td>
    <td class="table-cell table-actions">
      ${isTerminal
      ? `<span class="action-done">—</span>`
      : `<div class="action-btn-group">
             ${order.status === "PLACED"
        ? `<button class="btn btn-sm btn-secondary order-action-btn"
                    data-next="PREPARING">Accept</button>`
        : ""}
             ${order.status === "PREPARING"
        ? `<button class="btn btn-sm btn-secondary order-action-btn"
                    data-next="READY">Mark Ready</button>`
        : ""}
             ${order.status === "READY"
        ? `<button class="btn btn-sm btn-primary order-action-btn"
                    data-next="COMPLETED">Mark Served</button>`
        : ""}
             <button class="btn btn-sm btn-danger order-action-btn"
               data-next="CANCELLED">Cancel</button>
           </div>`
    }
    </td>
  `;

  return tr;
}

function buildItemsSummary(items) {
  if (!items || items.length === 0) return "—";
  return items
    .map((i) =>
      i.itemType === "print"
        ? `Print: ${i.fileName ?? i.productName ?? "document"}`
        : `${i.quantity}× ${i.productName ?? "item"}`
    )
    .join(", ");
}

// Status action buttons — visual only until backend adds PATCH endpoint.
// TODO: when PATCH /api/orders/{id}/status is added, call it here.
async function handleOrderAction(event) {
  const btn = event.target.closest(".order-action-btn");
  if (!btn) return;

  const row = btn.closest("tr");
  const orderId = Number(row.dataset.orderId);
  const nextStatus = btn.dataset.next;

  try {
    await updateOrderStatus(orderId, nextStatus);

    showToast(
      `Order #${orderId} → ${nextStatus}`,
      "success"
    );

    await renderAll();

  } catch (error) {
    showToast(error.message, "error");
  }
}

// ---------------------------------------------------------------------------
// Print jobs table
// Extract items with itemType === "print" across all orders.
// item shape from backend: { itemType, fileName, pages, copies, colorMode, paperSize, sided }
// ---------------------------------------------------------------------------

function renderPrintTable(orders) {
  const printJobs = orders.flatMap((order) =>
    (order.items ?? [])
      .filter((item) => item.itemType === "print")
      .map((item) => ({
        ...item,
        orderId: order.id,
        tokenNumber: order.tokenNumber,
        studentName: order.studentName,
        orderStatus: order.status,
      }))
  );

  if (printJobs.length === 0) {
    printTableBody.innerHTML = `
      <tr class="table-empty">
        <td colspan="7">No print jobs yet.</td>
      </tr>`;
    return;
  }

  printTableBody.replaceChildren(
    ...printJobs.slice(0, 10).map(buildPrintRow)
  );
}

function buildPrintRow(job) {
  const tr = document.createElement("tr");

  const colorLabel = job.colorMode === "COLOR" ? "Color" : "B/W";
  const sidedLabel = job.sided === "DOUBLE" ? "2-sided" : "1-sided";
  const isDone = job.orderStatus === "COMPLETED";

  const fileName =
    job.originalFileName ??
    job.fileName ??
    "document";
  const displayName = fileName.length > 24 ? fileName.slice(0, 21) + "…" : fileName;

  tr.innerHTML = `
    <td class="table-cell">
      <span class="admin-token">#${job.tokenNumber}</span>
    </td>
    <td class="table-cell">
      <div class="table-student">
        <span class="table-student-name">${job.studentName ?? "—"}</span>
      </div>
    </td>
    <td class="table-cell table-filename" title="${fileName}">
      ${displayName}
    </td>
    <td class="table-cell">
      ${job.pages ?? "—"} pg × ${job.copies ?? job.quantity ?? 1}
    </td>
    <td class="table-cell">
      ${colorLabel} · ${sidedLabel} · ${job.paperSize ?? "A4"}
    </td>
    <td class="table-cell">
      <span class="badge ${isDone ? "badge-completed" : "badge-preparing"}">
        ${isDone ? "Completed" : "Pending"}
      </span>
    </td>
    <td class="table-cell table-actions">
  <div class="action-btn-group">

    <a
      href="${FILE_API}/${job.fileName}"
      target="_blank"
      class="btn btn-sm btn-secondary">
      Download PDF
    </a>

    ${isDone
      ? `<span class="action-done">Done</span>`
      : `<button
             class="btn btn-sm btn-primary print-action-btn"
             data-order-id="${job.orderId}">
             Mark Done
           </button>`
    }

  </div>
</td>
  `;

  return tr;
}

// TODO: when PATCH /api/orders/{id}/status is added, call it here.
async function handlePrintAction(event) {
  const btn = event.target.closest(".print-action-btn");
  if (!btn) return;

  const orderId = Number(btn.dataset.orderId);

  try {
    await updateOrderStatus(orderId, "COMPLETED");

    showToast(
      "Print job completed",
      "success"
    );

    await renderAll();

  } catch (error) {
    showToast(error.message, "error");
  }
}

// ---------------------------------------------------------------------------
// Loading / error states
// ---------------------------------------------------------------------------

function setTablesLoading() {
  ordersTableBody.innerHTML = `
    <tr class="table-empty"><td colspan="7">Loading orders…</td></tr>`;
  printTableBody.innerHTML = `
    <tr class="table-empty"><td colspan="7">Loading print jobs…</td></tr>`;
}

function setTablesError() {
  ordersTableBody.innerHTML = `
    <tr class="table-empty">
      <td colspan="7">Failed to load orders. Check server connection.</td>
    </tr>`;
  printTableBody.innerHTML = `
    <tr class="table-empty">
      <td colspan="7">Failed to load print jobs.</td>
    </tr>`;
}

// ---------------------------------------------------------------------------
// Auto-refresh every 30 seconds
// ---------------------------------------------------------------------------

function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(renderAll, 30_000);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount) {
  return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status) {
  return {
    PLACED: "badge-placed",
    PREPARING: "badge-preparing",
    READY: "badge-ready",
    COMPLETED: "badge-completed",
    CANCELLED: "badge-cancelled",
  }[status] ?? "badge-placed";
}