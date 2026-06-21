// js/shared/toast.js
// Lightweight toast notification system.
// Replaces all alert() calls across the SkipQ student and admin modules.
// Usage: import { showToast } from "../shared/toast.js";
//        showToast("Added to cart", "success");
//
// Types: "success" | "error" | "info" | "warning"
// The toast container is injected once on first use and reused.

const TOAST_DURATION_MS = 3000;
const TOAST_ANIMATION_MS = 280;

let container = null;

function getContainer() {
  if (container) return container;

  container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  document.body.appendChild(container);
  return container;
}

/**
 * @param {string} message
 * @param {"success"|"error"|"info"|"warning"} [type="info"]
 * @param {number} [duration] milliseconds before auto-dismiss
 */
export function showToast(message, type = "info", duration = TOAST_DURATION_MS) {
  const root = getContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");

  const icon = getIcon(type);
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Dismiss notification">✕</button>
  `;

  toast.querySelector(".toast-close").addEventListener("click", () => dismiss(toast));

  root.appendChild(toast);

  // Trigger enter animation (next frame so transition fires)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("is-visible"));
  });

  const timer = setTimeout(() => dismiss(toast), duration);

  // Cancel auto-dismiss if user hovers (accessibility: screen readers may move slowly)
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
  toast.addEventListener("mouseleave", () => setTimeout(() => dismiss(toast), 1200));
}

function dismiss(toast) {
  toast.classList.remove("is-visible");
  toast.classList.add("is-leaving");
  setTimeout(() => toast.remove(), TOAST_ANIMATION_MS);
}

function getIcon(type) {
  const icons = {
    success: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6.5 10l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    error: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    warning: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.13 3.5L1.5 17h17L10.87 3.5a1 1 0 0 0-1.74 0Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M10 8v4M10 14.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    info: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 9v5M10 6.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  };
  return icons[type] ?? icons.info;
}