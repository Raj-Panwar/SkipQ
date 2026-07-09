// js/admin/adminApp.js
// NEW FILE — entry point for the Admin SPA shell.
//
// Responsibilities ONLY:
//   - guard the page behind an admin session (same "skipq_admin"
//     sessionStorage key used everywhere else in the admin app)
//   - populate the sticky header (college name, admin name, date)
//   - switch between the four <section> containers with no page reload
//   - handle the mobile sidebar drawer + logout
//
// All actual data/business logic (orders, print jobs, inventory,
// stats) lives in dashboardSection.js / ordersSection.js /
// inventorySection.js, each of which is initialised once below and
// exposes its own refresh, exactly as the previous per-page
// controllers did. No API, business logic, or tenant-isolation code
// is touched anywhere in this file.

import { showToast } from "../shared/toast.js";
import { getCollegeByCode } from "./collegeApi.js";
import { initDashboardSection } from "./dashboardSection.js";
import { initOrdersSection } from "./ordersSection.js";
import { initInventorySection } from "./inventorySection.js";
import { initNotificationsSection } from "./notificationsSection.js";

const ADMIN_SESSION_KEY = "skipq_admin";

const SECTIONS = ["dashboard", "orders", "inventory", "notifications"];

// ---------------------------------------------------------------------------
// Session guard (identical check to the one every admin page used before)
// ---------------------------------------------------------------------------
const adminRaw = sessionStorage.getItem(ADMIN_SESSION_KEY);
if (!adminRaw) {
  window.location.href = "./login.html";
}
const admin = adminRaw ? JSON.parse(adminRaw) : null;

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const sidebar = document.getElementById("adminSidebar");
const sidebarLinks = document.querySelectorAll(".admin-sidebar-link");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const sidebarOpenBtn = document.getElementById("sidebarOpenBtn");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const logoutBtn = document.getElementById("logoutAdminBtn");

const headerCollegeName = document.getElementById("headerCollegeName");
const headerAdminName = document.getElementById("headerAdminName");
const headerDate = document.getElementById("headerDate");

const quickActionButtons = document.querySelectorAll("[data-goto-section]");

init();

function init() {
  wireSidebarNav();
  wireMobileDrawer();
  wireLogout();
  populateHeader();

  // Section modules are initialised once up-front (each wires its own
  // events/auto-refresh); switching sections only shows/hides markup.
  initDashboardSection(admin);
  initOrdersSection();
  initInventorySection();
  initNotificationsSection();
  // Restore section from the URL hash if present (e.g. reload on
  // #orders keeps you on Orders), default to Dashboard.
  const initialSection = SECTIONS.includes(currentHash()) ? currentHash() : "dashboard";
  switchSection(initialSection, { pushHash: false });

  window.addEventListener("hashchange", () => {
    if (SECTIONS.includes(currentHash())) {
      switchSection(currentHash(), { pushHash: false });
    }
  });
}

function currentHash() {
  return window.location.hash.replace("#", "");
}

// ---------------------------------------------------------------------------
// Section switching
// ---------------------------------------------------------------------------
function switchSection(sectionId, { pushHash = true } = {}) {
  SECTIONS.forEach((id) => {
    const el = document.getElementById(`${id}Section`);
    if (el) el.hidden = id !== sectionId;
  });

  sidebarLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (pushHash) {
    window.location.hash = sectionId;
  }

  closeMobileDrawer();
}

function wireSidebarNav() {
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      switchSection(link.dataset.section);
    });
  });

  // Dashboard "Quick Actions" buttons reuse the same switcher.
  quickActionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchSection(btn.dataset.gotoSection);
    });
  });
}

// ---------------------------------------------------------------------------
// Mobile sidebar drawer
// ---------------------------------------------------------------------------
function wireMobileDrawer() {
  sidebarOpenBtn?.addEventListener("click", openMobileDrawer);
  sidebarCloseBtn?.addEventListener("click", closeMobileDrawer);
  sidebarBackdrop?.addEventListener("click", closeMobileDrawer);
}

function openMobileDrawer() {
  sidebar.classList.add("is-open");
  sidebarBackdrop.hidden = false;
}

function closeMobileDrawer() {
  sidebar.classList.remove("is-open");
  if (sidebarBackdrop) sidebarBackdrop.hidden = true;
}

// ---------------------------------------------------------------------------
// Logout — identical behaviour to every previous admin page controller
// ---------------------------------------------------------------------------
function wireLogout() {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showToast("Logged out", "info", 1200);
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 900);
  });
}

// ---------------------------------------------------------------------------
// Header: college name, admin name, current date
// ---------------------------------------------------------------------------
async function populateHeader() {
  if (!admin) return;

  headerAdminName.textContent = admin.fullName ?? "—";

  headerDate.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!admin.collegeCode) {
    headerCollegeName.textContent = "—";
    return;
  }

  try {
    const college = await getCollegeByCode(admin.collegeCode);
    headerCollegeName.textContent = `${college.name} · ${college.code}`;
  } catch (error) {
    // Non-fatal — fall back to just the code the admin logged in with.
    headerCollegeName.textContent = admin.collegeCode;
  }
}