// js/shared/auth.js
// Logout helper shared between the student nav bar and the admin module.
// Centralised here so both clear the same keys in the same order.

import { clearSession } from "../auth/tokenStorage.js";
import { clearCart } from "../student/cartStore.js";
import { showToast } from "./toast.js";

/**
 * Clears all session and cart state, shows a goodbye toast,
 * then redirects to the student login page.
 * Safe to call from any page depth — uses absolute path from root.
 */
export function logout() {
  clearSession();   // removes skipq_token + skipq_user
  clearCart();      // removes skipq_cart (optional but clean)
  // Preserve skipq_order_history — students may want to see past orders
  // even after logging back in on the same device.

  showToast("Logged out successfully", "info", 1500);

  setTimeout(() => {
    // Works from both /student/* and /admin/* by going to absolute path.
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = depth > 1 ? "../".repeat(depth - 1) : "./";
    window.location.href = `${prefix}student/login.html`;
  }, 900);
}