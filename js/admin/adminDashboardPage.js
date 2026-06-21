// js/admin/adminDashboardPage.js
// Admin dashboard page controller.
// Renders live-ish stats cards, recent orders table, and print jobs table.
// Status updates are persisted in localStorage via adminStore.js.

import {
  getOrders,
  getPrintJobs,
  getDashboardStats,
  updateOrderStatus,
  updatePrintJobStatus,
  ORDER_STATUSES,
  PRINT_JOB_STATUSES,
} from "./adminStore.js";
import { showToast } from "../shared/toast.js";
import { formatCurrency, formatDate, formatTime } from "../utils/formatters.js";

const ADMIN_SESSION_KEY = "skipq_admin_session";

// Guard: redirect to login if no admin session.
if (!sessionStorage.getItem(ADMIN_SESSION_KEY)) {
  window.location.href = "./login.html";
}

const statOrdersEl = document.getElementById("statOrdersToday");
const statTokensEl = document.getElementById("statActiveTokens");
const statPrintEl = document.getElementById("statPendingPrint");
const statRevenueEl = document.getElementById("statRevenue");

const ordersTableBody = document.getElementById("ordersTableBody");
const printTableBody = document.getElementById("printTableBody");

const refreshBtn = document.getElementById("refreshBtn");
const logoutAdminBtn = document.getElementById("logoutAdminBtn");

let refreshInterval = null;

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

  ordersTableBody.addEventListener("click", handleOrderAction);
  printTableBody.addEventListener("click", handlePrintAction);
}

function renderAll() {
  renderStats();
  renderOrdersTable();
  renderPrintTable();
}

/* ==========================================================
   Stats cards
========================================================== */

function renderStats() {
  const stats = getDashboardStats();
  animateCount(statOrdersEl, stats.totalOrdersToday);
  animateCount(statTokensEl, stats.activeTokens);
  animateCount(statPrintEl, stats.pendingPrintJobs);
  statRevenueEl.textContent = formatCurrency(stats.revenueToday);
}

function animateCount(el, target) {
  const start = Number(el.textContent) || 0;
  if (start === target) return;
  const duration = 500;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.round(start + (target - start) * t);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ==========================================================
   Orders table
========================================================== */

function renderOrdersTable() {
  const orders = getOrders().slice(0, 15); // show latest 15

  if (orders.length === 0) {
    ordersTableBody.innerHTML = `
      <tr class="table-empty">
        <td colspan="7">No orders yet today.</td>
      </tr>`;
    return;
  }

  ordersTableBody.replaceChildren(
    ...orders.map(buildOrderRow)
  );
}

function buildOrderRow(order) {
  const tr = document.createElement("tr");
  tr.dataset.orderId = String(order.orderId);

  const isTerminal = [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status);

  tr.innerHTML = `
    <td class="table-cell">
      <span class="admin-token">${order.tokenNumber}</span>
    </td>
    <td class="table-cell">
      <div class="table-student">
        <span class="table-student-name">${order.studentName}</span>
        <span class="table-student-roll">${order.rollNumber}</span>
      </div>
    </td>
    <td class="table-cell table-items">
      ${order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
    </td>
    <td class="table-cell">
      <span class="admin-amount">${formatCurrency(order.totalAmount)}</span>
    </td>
    <td class="table-cell">
      <span class="badge ${statusBadgeClass(order.status)}">${order.status}</span>
    </td>
    <td class="table-cell table-time">
      <span>${formatTime(order.placedAt)}</span>
    </td>
    <td class="table-cell table-actions">
      ${isTerminal
        ? `<span class="action-done">—</span>`
        : `<div class="action-btn-group">
             ${order.status === ORDER_STATUSES.PLACED
               ? `<button class="btn btn-sm btn-secondary order-action-btn" data-next="${ORDER_STATUSES.PREPARING}">Accept</button>`
               : ""}
             ${order.status === ORDER_STATUSES.PREPARING
               ? `<button class="btn btn-sm btn-secondary order-action-btn" data-next="${ORDER_STATUSES.READY}">Mark Ready</button>`
               : ""}
             ${order.status === ORDER_STATUSES.READY
               ? `<button class="btn btn-sm btn-primary order-action-btn" data-next="${ORDER_STATUSES.COMPLETED}">Mark Served</button>`
               : ""}
             <button class="btn btn-sm btn-danger order-action-btn" data-next="${ORDER_STATUSES.CANCELLED}">Cancel</button>
           </div>`
      }
    </td>
  `;

  return tr;
}

function handleOrderAction(event) {
  const btn = event.target.closest(".order-action-btn");
  if (!btn) return;

  const row = btn.closest("tr");
  const orderId = Number(row.dataset.orderId);
  const nextStatus = btn.dataset.next;

  const success = updateOrderStatus(orderId, nextStatus);
  if (!success) return;

  const order = getOrders().find((o) => o.orderId === orderId);
  const isPositive = [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.READY].includes(nextStatus);
  const isCancel = nextStatus === ORDER_STATUSES.CANCELLED;

  showToast(
    `Token ${order?.tokenNumber ?? ""} → ${nextStatus}`,
    isCancel ? "error" : isPositive ? "success" : "info"
  );

  renderAll();
}

/* ==========================================================
   Print jobs table
========================================================== */

function renderPrintTable() {
  const jobs = getPrintJobs().slice(0, 10);

  if (jobs.length === 0) {
    printTableBody.innerHTML = `
      <tr class="table-empty">
        <td colspan="7">No print jobs yet.</td>
      </tr>`;
    return;
  }

  printTableBody.replaceChildren(...jobs.map(buildPrintRow));
}

function buildPrintRow(job) {
  const tr = document.createElement("tr");
  tr.dataset.jobId = job.jobId;

  const isDone = job.status === PRINT_JOB_STATUSES.COMPLETED;
  const colorLabel = job.colorMode === "COLOR" ? "Color" : "B/W";
  const sidedLabel = job.sided === "DOUBLE" ? "2-sided" : "1-sided";

  tr.innerHTML = `
    <td class="table-cell">
      <span class="admin-token">${job.tokenNumber}</span>
    </td>
    <td class="table-cell">
      <div class="table-student">
        <span class="table-student-name">${job.studentName}</span>
        <span class="table-student-roll">${job.rollNumber}</span>
      </div>
    </td>
    <td class="table-cell table-filename" title="${job.fileName}">
      ${job.fileName.length > 24 ? job.fileName.slice(0, 21) + "…" : job.fileName}
    </td>
    <td class="table-cell">
      ${job.pages} pg × ${job.copies}
    </td>
    <td class="table-cell">
      ${colorLabel} · ${sidedLabel} · ${job.paperSize}
    </td>
    <td class="table-cell">
      <span class="badge ${printBadgeClass(job.status)}">${job.status}</span>
    </td>
    <td class="table-cell table-actions">
      ${isDone
        ? `<span class="action-done">Done</span>`
        : `<div class="action-btn-group">
             ${job.status === PRINT_JOB_STATUSES.PENDING
               ? `<button class="btn btn-sm btn-secondary print-action-btn" data-next="${PRINT_JOB_STATUSES.PRINTING}">Start Printing</button>`
               : ""}
             ${job.status === PRINT_JOB_STATUSES.PRINTING
               ? `<button class="btn btn-sm btn-primary print-action-btn" data-next="${PRINT_JOB_STATUSES.COMPLETED}">Mark Completed</button>`
               : ""}
           </div>`
      }
    </td>
  `;

  return tr;
}

function handlePrintAction(event) {
  const btn = event.target.closest(".print-action-btn");
  if (!btn) return;

  const row = btn.closest("tr");
  const jobId = row.dataset.jobId;
  const nextStatus = btn.dataset.next;

  updatePrintJobStatus(jobId, nextStatus);

  const job = getPrintJobs().find((j) => j.jobId === jobId);
  const isDone = nextStatus === PRINT_JOB_STATUSES.COMPLETED;

  showToast(
    `Print job (${job?.fileName?.slice(0, 20) ?? jobId}) → ${nextStatus}`,
    isDone ? "success" : "info"
  );

  renderAll();
}

/* ==========================================================
   Helpers
========================================================== */

function statusBadgeClass(status) {
  return {
    [ORDER_STATUSES.PLACED]: "badge-placed",
    [ORDER_STATUSES.PREPARING]: "badge-preparing",
    [ORDER_STATUSES.READY]: "badge-ready",
    [ORDER_STATUSES.COMPLETED]: "badge-completed",
    [ORDER_STATUSES.CANCELLED]: "badge-cancelled",
  }[status] || "badge-placed";
}

function printBadgeClass(status) {
  return {
    [PRINT_JOB_STATUSES.PENDING]: "badge-placed",
    [PRINT_JOB_STATUSES.PRINTING]: "badge-preparing",
    [PRINT_JOB_STATUSES.COMPLETED]: "badge-completed",
  }[status] || "badge-placed";
}

function startAutoRefresh() {
  // Refresh stats every 30 s to reflect changes made from another tab/device.
  refreshInterval = setInterval(() => {
    renderStats();
  }, 30000);
}