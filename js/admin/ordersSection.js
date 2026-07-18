// js/admin/ordersSection.js
// NEW FILE — controller for the Orders section of the Admin SPA.
//
// This is the previous js/admin/adminDashboardPage.js order + print-job
// logic, carried over function-for-function and unchanged: same
// adminApi.js calls (getDashboardStats, updateOrderStatus, searchOrders),
// same DOM element IDs, same filters object, same status-action buttons,
// same 30s auto-refresh. The only genuinely new things are:
//   - the two sections are now collapsible cards (expand/collapse), and
//   - a manual "Refresh" button (moved here from the old page header).
// Nothing about how orders/print jobs are fetched, filtered, paginated
// or updated has changed.

import { getDashboardStats, updateOrderStatus, searchOrders } from "./adminApi.js";
import { renderPagination } from "../shared/pagination.js";
import { showToast } from "../shared/toast.js";

const FILE_API = "http://localhost:8080/api/files";
const REFRESH_INTERVAL_MS = 30_000;

// Table bodies
const ordersTableBody = document.getElementById("ordersTableBody");
const ordersPageInfo = document.getElementById("ordersPageInfo");
const printTableBody = document.getElementById("printTableBody");

// Toolbar
const orderSearchInput = document.getElementById("orderSearchInput");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const orderDateFilter = document.getElementById("orderDateFilter");
const orderSortFilter = document.getElementById("orderSortFilter");
const ordersRefreshBtn = document.getElementById("ordersRefreshBtn");

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

export function initOrdersSection() {
  wireCollapsibleCards();
  wireToolbar();
  wireRefreshButton();

  ordersTableBody?.addEventListener("click", handleOrderAction);
  printTableBody?.addEventListener("click", handlePrintAction);

  renderAll();
  startAutoRefresh();
}

// ---------------------------------------------------------------------------
// Collapsible cards
// ---------------------------------------------------------------------------
function wireCollapsibleCards() {
  document.querySelectorAll(".collapsible-card-header[data-collapsible-toggle]").forEach((header) => {
    header.addEventListener("click", () => {
      const card = header.closest(".collapsible-card");
      card.classList.toggle("is-collapsed");
      const expanded = !card.classList.contains("is-collapsed");
      header.setAttribute("aria-expanded", String(expanded));
    });
  });
}

// ---------------------------------------------------------------------------
// Toolbar wiring
// ---------------------------------------------------------------------------
function wireToolbar() {
  orderSearchInput?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filters.query = orderSearchInput.value.trim();
      filters.page = 0;
      performSearch();
    }, 400);
  });

  orderStatusFilter?.addEventListener("change", () => {
    filters.status = orderStatusFilter.value;
    filters.page = 0;
    performSearch();
  });

  orderDateFilter?.addEventListener("change", () => {
    filters.date = orderDateFilter.value;
    filters.page = 0;
    performSearch();
  });

  orderSortFilter?.addEventListener("change", () => {
    filters.sort = orderSortFilter.value;
    filters.page = 0;
    performSearch();
  });
}

function wireRefreshButton() {
  ordersRefreshBtn?.addEventListener("click", () => {
    renderAll();
    showToast("Orders refreshed", "info", 2000);
  });
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
    showToast("Unable to load orders data", "error");
    setTablesError();
    return;
  }

  await loadOrders();
  renderPrintTable(stats.orders);
}

async function loadOrders() {
  setTablesLoading();

  try {
    const page = await searchOrders(filters);

    renderOrdersTable(page.content);
    renderPageInfo(page);
    renderPagination("ordersPagination", page, (newPage) => {
      filters.page = newPage;
      loadOrders();
    });
  } catch (error) {
    showToast(error.message, "error");
    setTablesError();
  }
}

async function performSearch() {
  const hasFilters =
    filters.query || filters.status || filters.date || filters.sort !== "newest";

  if (!hasFilters) {
    renderAll();
    return;
  }

  setTablesLoading();

  try {
    const page = await searchOrders(filters);
    renderOrdersTable(page.content);
    renderPageInfo(page);
    renderPagination("ordersPagination", page, (newPage) => {
      filters.page = newPage;
      loadOrders();
    });
  } catch (error) {
    showToast(error.message, "error");
    setTablesError();
  }
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

  ordersTableBody.replaceChildren(...orders.map(buildOrderRow));
}

function renderPageInfo(page) {
  if (!page) {
    ordersPageInfo.textContent = "";
    return;
  }

  const start = page.totalElements === 0 ? 0 : page.number * page.size + 1;
  const end = Math.min((page.number + 1) * page.size, page.totalElements);

  ordersPageInfo.innerHTML = `
<b>${page.totalElements}</b> Orders
•
Showing <b>${start}-${end}</b>
•
Page <b>${page.number + 1}</b> of <b>${page.totalPages}</b>
`;
}

function buildOrderRow(order) {
  const tr = document.createElement("tr");
  tr.dataset.orderId = String(order.id);

  const isTerminal = order.status === "COMPLETED" || order.status === "CANCELLED";

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
      ${buildOrderNotesLine(order.notes)}
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
        ? `<button class="btn btn-sm btn-secondary order-action-btn" data-next="PREPARING">Accept</button>`
        : ""
      }
             ${order.status === "PREPARING"
        ? `<button class="btn btn-sm btn-secondary order-action-btn" data-next="READY">Mark Ready</button>`
        : ""
      }
             ${order.status === "READY"
        ? `<button class="btn btn-sm btn-primary order-action-btn" data-next="COMPLETED">Mark Served</button>`
        : ""
      }
             <button class="btn btn-sm btn-danger order-action-btn" data-next="CANCELLED">Cancel</button>
           </div>`
    }
    </td>
  `;

  return tr;
}

function buildItemsSummary(items) {

  if (!items || items.length === 0) {
    return "—";
  }

  return items
    .map((item) => {

      if (item.itemType === "print") {

        return `
          <div class="order-item-line">
            📄 Print: ${item.originalFileName ?? item.fileName ?? "document"}
          </div>
        `;

      }

      return `
        <div class="order-item-line">
          ${item.quantity}× ${item.productName}
        </div>
      `;

    })
    .join("");

}

function buildOrderNotesLine(notes) {
  const hasNotes = notes && notes.trim().length > 0;
  return `
    <div class="order-notes-line${hasNotes ? "" : " order-notes-line-empty"}">
      📝 ${hasNotes ? escapeHtml(notes) : "No notes"}
    </div>
  `;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function handleOrderAction(event) {
  const btn = event.target.closest(".order-action-btn");
  if (!btn || btn.disabled) return;

  const row = btn.closest("tr");
  const orderId = Number(row.dataset.orderId);
  const nextStatus = btn.dataset.next;

  btn.disabled = true;

  try {
    await updateOrderStatus(orderId, nextStatus);
    showToast(`Order #${orderId} → ${nextStatus}`, "success");
    await renderAll();
  } catch (error) {
    showToast(error.message, "error");
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Print jobs table
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

  printTableBody.replaceChildren(...printJobs.slice(0, 10).map(buildPrintRow));
}

function buildPrintRow(job) {
  const tr = document.createElement("tr");

  const colorLabel = job.colorMode === "COLOR" ? "Color" : "B/W";
  const sidedLabel = job.sided === "DOUBLE" ? "2-sided" : "1-sided";
  const isDone = job.orderStatus === "COMPLETED";

  const fileName = job.originalFileName ?? job.fileName ?? "document";
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

async function handlePrintAction(event) {
  const btn = event.target.closest(".print-action-btn");
  if (!btn || btn.disabled) return;

  const orderId = Number(btn.dataset.orderId);

  btn.disabled = true;

  try {
    await updateOrderStatus(orderId, "COMPLETED");
    showToast("Print job completed", "success");
    await renderAll();
  } catch (error) {
    showToast(error.message, "error");
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Loading / error states
// ---------------------------------------------------------------------------
function skeletonRows(colCount, rowCount = 5) {
  return Array.from({ length: rowCount }, () => `
    <tr class="skeleton-table-row">
      ${Array.from({ length: colCount }, () => `<td><div class="skeleton-text"></div></td>`).join("")}
    </tr>`).join("");
}

function setTablesLoading() {
  ordersTableBody.innerHTML = skeletonRows(7);
  printTableBody.innerHTML = skeletonRows(7, 3);
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
  refreshInterval = setInterval(renderAll, REFRESH_INTERVAL_MS);
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
  return (
    {
      PLACED: "badge-placed",
      PREPARING: "badge-preparing",
      READY: "badge-ready",
      COMPLETED: "badge-completed",
      CANCELLED: "badge-cancelled",
    }[status] ?? "badge-placed"
  );
}
export function destroyOrdersSection() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}