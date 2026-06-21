// js/shared/nav.js
// Injects the SkipQ student navigation bar into any page that calls
// initStudentNav(). Keeps nav markup in one place so changes propagate
// everywhere without touching individual HTML files.
//
// Usage (at the top of any page controller):
//   import { initStudentNav } from "../shared/nav.js";
//   initStudentNav("menu");  // highlights the active item

import { getCartCount } from "../student/cartStore.js";
import { logout } from "./auth.js";

const NAV_ITEMS = [
  { id: "menu",    label: "Menu",    href: "./menu.html",    icon: gridIcon() },
  { id: "cart",    label: "Cart",    href: "./cart.html",    icon: cartIcon() },
  { id: "token",   label: "Token",   href: "./token.html",   icon: tokenIcon() },
  { id: "history", label: "History", href: "./history.html", icon: historyIcon() },
];

/**
 * Builds and injects the sticky bottom nav into the current page.
 * Also attaches the logout button handler if an element with
 * id="logoutBtn" exists on the page.
 *
 * @param {"menu"|"cart"|"token"|"history"|""} activeId
 */
export function initStudentNav(activeId = "") {
  injectBottomNav(activeId);
  wireLogoutButtons();
}

function injectBottomNav(activeId) {
  // Avoid double-injection on HMR / dev reloads
  if (document.getElementById("studentBottomNav")) return;

  const cartCount = getCartCount();

  const nav = document.createElement("nav");
  nav.id = "studentBottomNav";
  nav.className = "student-bottom-nav";
  nav.setAttribute("aria-label", "Main navigation");

  nav.innerHTML = NAV_ITEMS.map((item) => {
    const isActive = item.id === activeId;
    const isCart = item.id === "cart";
    const badgeHtml = isCart && cartCount > 0
      ? `<span class="nav-badge" aria-label="${cartCount} items in cart">${cartCount}</span>`
      : "";

    return `
      <a href="${item.href}"
         class="nav-tab ${isActive ? "is-active" : ""}"
         ${isActive ? 'aria-current="page"' : ""}
         data-nav-id="${item.id}">
        <span class="nav-tab-icon">${item.icon}${badgeHtml}</span>
        <span class="nav-tab-label">${item.label}</span>
      </a>
    `;
  }).join("") + `
    <button type="button" class="nav-tab nav-tab-logout" id="navLogoutBtn" aria-label="Log out">
      <span class="nav-tab-icon">${logoutIcon()}</span>
      <span class="nav-tab-label">Logout</span>
    </button>
  `;

  document.body.appendChild(nav);

  // Add bottom padding to main content so the nav doesn't cover it
  const main = document.querySelector(".app-main, main");
  if (main) main.classList.add("has-bottom-nav");

  nav.querySelector("#navLogoutBtn").addEventListener("click", logout);
}

function wireLogoutButtons() {
  // Also wire any in-page logout buttons the HTML defines explicitly
  // (e.g. the desktop header logout link)
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
}

// ---------- SVG icons ----------

function gridIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
  </svg>`;
}

function cartIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="21" r="1.4" fill="currentColor"/>
    <circle cx="18" cy="21" r="1.4" fill="currentColor"/>
  </svg>`;
}

function tokenIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
    <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function historyIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8v4l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.05 11a9 9 0 1 0 .5-3M3 4v4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function logoutIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}