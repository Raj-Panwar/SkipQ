// js/utils/formatters.js
// Small, dependency-free formatting helpers shared across pages.

/**
 * Formats a number as Indian Rupees, e.g. 1250 -> "₹1,250".
 * @param {number} amount
 */
export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/**
 * Formats an ISO date string into a short readable date, e.g. "12 Jun 2026".
 * @param {string|Date} value
 */
export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Formats an ISO date string into a short time, e.g. "4:05 PM".
 * @param {string|Date} value
 */
export function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/**
 * Pads a numeric token into the SkipQ display format, e.g. 46 -> "#046".
 * @param {number} value
 */
export function formatToken(value) {
  return `#${String(value).padStart(3, "0")}`;
}