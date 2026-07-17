// js/admin/dashboardSection.js
// NEW FILE — controller for the Dashboard section of the Admin SPA.
//
// Pure overview: stat cards + College Info + Admin Info + Quick Actions
// (wired centrally in adminApp.js) + optional Recent Activity.
// No tables here, per spec.
//
// Data sources — all EXISTING, unmodified:
//   - getDashboardStats() from adminApi.js (already computes
//     totalOrdersToday / activeTokens / pendingPrintJobs / revenueToday
//     client-side from GET /api/orders, and also returns the raw
//     `orders` array, which we reuse below for the "Ready Orders" stat
//     and the Recent Activity list — no extra network calls needed for
//     those two).
//   - getLowStockProducts() from productApi.js (GET /api/products/low-stock)
//     for the "Low Stock Products" count.
//   - getCollegeByCode() from the new collegeApi.js wrapper (GET
//     /api/colleges/code/{code}, an endpoint that already existed).
//
// NOTE on "Total Students": the spec asks for this "if possible". There
// is no endpoint anywhere in the backend that lists/counts students
// (StudentController only has /register and /login; StudentRepository
// has no count-by-college query). Deriving it from order data would
// only count students who have placed an order, which is not the same
// thing as "Total Students" and would be misleading. Since adding a
// backend endpoint is out of scope for this UI-only task, this stat is
// intentionally omitted rather than shown with fabricated data.

import { getDashboardStats } from "./adminApi.js";
import { getLowStockProducts } from "./productApi.js";
import { getCollegeByCode } from "./collegeApi.js";

const REFRESH_INTERVAL_MS = 30_000;

let refreshTimer = null;
let statsEverLoaded = false;
let lowStockEverLoaded = false;

const STAT_IDS = [
  "statOrdersToday",
  "statActiveOrders",
  "statReadyOrders",
  "statPendingPrint",
  "statRevenueToday",
  "statLowStockProducts",
];
export function initDashboardSection(admin) {
  renderAdminInfo(admin);
  renderCollegeInfo(admin);
  setRecentActivityLoading();
  setStatsLoading();

  refreshAll();

  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL_MS);
  
}

// ---------------------------------------------------------------------------
// Admin / College info cards
// ---------------------------------------------------------------------------
function renderAdminInfo(admin) {
  const nameEl = document.getElementById("dashAdminName");
  const emailEl = document.getElementById("dashAdminEmail");
  if (!admin) return;

  if (nameEl) nameEl.textContent = admin.fullName ?? "—";
  if (emailEl) emailEl.textContent = admin.email ?? "—";
}

async function renderCollegeInfo(admin) {
  const nameEl = document.getElementById("dashCollegeName");
  const codeEl = document.getElementById("dashCollegeCode");
  if (!admin?.collegeCode) return;

  if (codeEl) codeEl.textContent = admin.collegeCode;

  try {
    const college = await getCollegeByCode(admin.collegeCode);
    if (nameEl) nameEl.textContent = college.name;
  } catch (error) {
    if (nameEl) nameEl.textContent = "—";
  }
}

// ---------------------------------------------------------------------------
// Stat cards + Recent Activity
// ---------------------------------------------------------------------------
async function refreshAll() {
  try {
    const stats = await getDashboardStats();
    renderStats(stats);
    renderRecentActivity(stats.orders);
    statsEverLoaded = true;
  } catch (error) {
    // Silent — the Orders section surfaces its own load errors via
    // toast, and the Dashboard simply keeps its last-known values
    // rather than interrupting the admin with a duplicate error.
    console.error("Dashboard refresh failed:", error);

    // Exception: if this is the very first load, there are no
    // last-known values to fall back on — the skeletons would
    // otherwise shimmer forever.
    if (!statsEverLoaded) {
      STAT_IDS.forEach((id) => setStat(id, "—"));
      const revenueEl = document.getElementById("statRevenueToday");
      if (revenueEl) revenueEl.textContent = "—";
      setRecentActivityError();
    }
  }

  try {
    const lowStock = await getLowStockProducts();
    setStat("statLowStockProducts", lowStock.length);
    lowStockEverLoaded = true;
  } catch (error) {
    console.error("Low stock fetch failed:", error);
    if (!lowStockEverLoaded) {
      setStat("statLowStockProducts", "—");
    }
  }
}

function renderStats(stats) {
  setStat("statOrdersToday", stats.totalOrdersToday);
  setStat("statActiveOrders", stats.activeTokens);
  setStat(
    "statReadyOrders",
    stats.orders.filter((o) => o.status === "READY").length
  );
  setStat("statPendingPrint", stats.pendingPrintJobs);

  const revenueEl = document.getElementById("statRevenueToday");
  if (revenueEl) revenueEl.textContent = formatCurrency(stats.revenueToday);
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function setStatsLoading() {
  STAT_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<span class="skeleton-text" style="width:32px;height:18px;display:inline-block;"></span>`;
  });
}

function setRecentActivityLoading() {
  const list = document.getElementById("recentActivityList");
  if (!list) return;
  list.innerHTML = Array.from({ length: 4 }, () => `
    <li class="recent-activity-item">
      <span class="skeleton-circle" style="width:8px;height:8px;"></span>
      <span class="recent-activity-text"><div class="skeleton-text" style="width:70%;"></div></span>
      <span class="recent-activity-time"><div class="skeleton-text" style="width:40px;"></div></span>
    </li>`).join("");
}

function setRecentActivityError() {
  const list = document.getElementById("recentActivityList");
  if (!list) return;
  list.innerHTML = `<li class="recent-activity-empty">Couldn't load recent activity.</li>`;
}

function renderRecentActivity(orders) {
  const list = document.getElementById("recentActivityList");
  if (!list) return;

  if (!orders || orders.length === 0) {
    list.innerHTML = `<li class="recent-activity-empty">No activity yet.</li>`;
    return;
  }

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  list.innerHTML = recent
    .map((order) => {
      return `
        <li class="recent-activity-item">
          <span class="recent-activity-dot recent-activity-dot-${statusDotClass(order.status)}"></span>
          <span class="recent-activity-text">
            Order <strong>#${order.tokenNumber}</strong> — ${order.studentName ?? "Guest"}
            <span class="recent-activity-status">${order.status}</span>
          </span>
          <span class="recent-activity-time">${formatTimeAgo(order.createdAt)}</span>
        </li>
      `;
    })
    .join("");
}

function statusDotClass(status) {
  return (
    {
      PLACED: "placed",
      PREPARING: "preparing",
      READY: "ready",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
    }[status] ?? "placed"
  );
}

function formatCurrency(amount) {
  return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
}

function formatTimeAgo(iso) {
  if (!iso) return "—";
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} day ago`;
}
export function destroyDashboardSection() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}