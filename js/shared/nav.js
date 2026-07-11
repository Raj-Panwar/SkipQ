// js/shared/nav.js
// Injects the SkipQ student navigation bar into any page that calls
// initStudentNav(). Keeps nav markup in one place so changes propagate
// everywhere without touching individual HTML files.
//
// Usage (at the top of any page controller):
//   import { initStudentNav } from "../shared/nav.js";
//   initStudentNav("menu");  // highlights the active item

import { getCartCount } from "../student/cartStore.js";

const NAV_ITEMS = [
  { id: "menu",    label: "Menu",    href: "./menu.html",    icon: gridIcon() },
  { id: "cart",    label: "Cart",    href: "./cart.html",    icon: cartIcon() },
  { id: "token",   label: "Token",   href: "./token.html",   icon: tokenIcon() },
  { id: "notifications", label: "Notifications", icon: bellIcon() },
  { id: "profile", label: "Profile", href: "./profile.html", icon: profileIcon() },
];

/**
 * Builds and injects the sticky bottom nav into the current page.
 *
 * @param {"menu"|"cart"|"token"|"notifications"|"profile"|""} activeId
 */
export function initStudentNav(activeId = "") {
  injectBottomNav(activeId);
}

function injectBottomNav(activeId) {
  // Avoid double-injection on HMR / dev reloads
  if (document.getElementById("studentBottomNav")) return;

  const cartCount = getCartCount();
  const onMenuPage = /menu\.html$/.test(window.location.pathname);

  const nav = document.createElement("nav");
  nav.id = "studentBottomNav";
  nav.className = "student-bottom-nav";
  nav.setAttribute("aria-label", "Main navigation");

  nav.innerHTML = NAV_ITEMS.map((item) => {
    const isActive = item.id === activeId;
    const isCart = item.id === "cart";
    const isNotifications = item.id === "notifications";
    const badgeHtml = isCart && cartCount > 0
      ? `<span class="nav-badge" aria-label="${cartCount} items in cart">${cartCount}</span>`
      : "";

    // The Notifications tab has no page of its own — it opens the
    // existing bell dropdown (on the Menu page directly, or after
    // navigating to the Menu page from anywhere else). Render it as a
    // button rather than a link so we can control that behavior.
    if (isNotifications) {
      return `
        <button type="button"
           class="nav-tab ${isActive ? "is-active" : ""}"
           data-nav-id="${item.id}"
           id="navNotificationsBtn">
          <span class="nav-tab-icon">${item.icon}</span>
          <span class="nav-tab-label">${item.label}</span>
        </button>
      `;
    }

    return `
      <a href="${item.href}"
         class="nav-tab ${isActive ? "is-active" : ""}"
         ${isActive ? 'aria-current="page"' : ""}
         data-nav-id="${item.id}">
        <span class="nav-tab-icon">${item.icon}${badgeHtml}</span>
        <span class="nav-tab-label">${item.label}</span>
      </a>
    `;
  }).join("");

  document.body.appendChild(nav);

  // Add bottom padding to main content so the nav doesn't cover it
  const main = document.querySelector(".app-main, main");
  if (main) main.classList.add("has-bottom-nav");

  const notificationsBtn = document.getElementById("navNotificationsBtn");
  notificationsBtn?.addEventListener("click", () => {
    if (onMenuPage) {
      document.getElementById("notificationBell")?.click();
    } else {
      window.location.href = "./menu.html?openNotifications=1";
    }
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

function bellIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3a5 5 0 0 0-5 5v2.3c0 .7-.2 1.3-.6 1.9L5 14.5V16h14v-1.5l-1.4-2.3c-.4-.6-.6-1.2-.6-1.9V8a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}

function profileIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.6"/>
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}