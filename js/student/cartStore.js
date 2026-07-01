// js/student/cartStore.js
//
// Shared cart state, backed by localStorage. No backend Cart entity exists
// in the MVP — the cart lives entirely on the client until checkout, when
// the full item list is used to decrement inventory and is sent to
// /orders (simulated) in one call.
//
// CHANGED: addToCart() and setQuantity() now clamp against live stock
// from inventoryStore.js, so the cart can never silently hold more units
// of a product than are actually available — even if a quantity request
// arrives from somewhere other than the menu page's own UI guard.

import { getProductById } from "./menuApi.js";
import { getSession } from "../shared/auth.js";

function getCartKey() {
    const student = getSession();

    return student
        ? `skipq_cart_${student.id}`
        : "skipq_cart_guest";
}
function getHistoryKey() {
    const student = getSession();

    return student
        ? `skipq_order_history_${student.id}`
        : "skipq_order_history_guest";
}

/** @returns {Array} */
export function getCart() {
  const raw = localStorage.getItem(getCartKey());
  return raw ? JSON.parse(raw) : [];
}

function saveCart(items) {
  localStorage.setItem(getCartKey(), JSON.stringify(items));
}

/* ==========================================================
   Stationery Products
========================================================== */

/**
 * Adds a stationery product to the cart, or increments quantity if
 * already present. Quantity is clamped to the product's live stock
 * (read fresh from inventoryStore.js) so the cart can never exceed
 * what's actually available.
 *
 * @param {{ id: number, name: string, category: string, price: number }} product
 * @param {number} [quantity=1]
 * @returns {Array} the updated cart
 */
export async function addToCart(product, quantity = 1) {
  const items = getCart();
  const liveProduct = await getProductById(product.id);
  const availableStock = liveProduct ? liveProduct.stock : Infinity;
  console.log(liveProduct);

  const existing = items.find(
    (item) => item.itemType === "stationery" && item.productId === product.id
  );

  if (existing) {
    existing.quantity = Math.min(availableStock, existing.quantity + quantity);
  } else {
    items.push({
      cartItemId: crypto.randomUUID(),
      itemType: "stationery",
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: Math.min(availableStock, quantity),
    });
  }

  saveCart(items);
  return items;
}

/* ==========================================================
   Print Jobs
========================================================== */

export function addPrintJob(printJob) {
  const items = getCart();

  items.push({
    cartItemId: crypto.randomUUID(),
    itemType: "print",
    fileName: printJob.fileName,
    pages: printJob.pages ?? 1,
    copies: printJob.copies,
    colorMode: printJob.colorMode,
    sided: String(printJob.sided || "SINGLE").toUpperCase(),
    paperSize: printJob.paperSize || "A4",
    totalPrice: Number.isFinite(printJob.totalPrice) ? printJob.totalPrice : 0,
  });

  saveCart(items);
  return items;
}

/* ==========================================================
   Quantity Updates (stationery only)
========================================================== */

/**
 * Sets a stationery cart item's quantity to an absolute value, clamped
 * to [0, live stock]. Removes the item if quantity resolves to 0.
 * @param {string} cartItemId
 * @param {number} quantity
 */
export async function setQuantity(cartItemId, quantity) {
  

    let items = getCart();

    const existing = items.find(
        item => item.cartItemId === cartItemId
    );

    if (!existing || existing.itemType !== "stationery") {
        saveCart(items);
        return items;
    }

    const liveProduct = await getProductById(existing.productId);

    const availableStock = liveProduct
        ? liveProduct.stock
        : Infinity;
        console.log({
    currentQty: existing.quantity,
    requestedQty: quantity,
    availableStock
  });

    const clamped = Math.min(
        availableStock,
        Math.max(0, quantity)
    );

    if (clamped <= 0) {
        items = items.filter(
            item => item.cartItemId !== cartItemId
        );
    } else {
        existing.quantity = clamped;
    }

    saveCart(items);
    return items;
}


/**==============================PRINT ADD COPIES================ */
export function setPrintCopies(cartItemId, copies) {

    const items = getCart();

    const item = items.find(
        i => i.cartItemId === cartItemId &&
             i.itemType === "print"
    );

    if (!item) return items;

    item.copies = Math.max(1, copies);

    const rate =
        item.colorMode === "COLOR"
            ? 10
            : 2;

    item.totalPrice =
        item.pages *
        item.copies *
        rate;

    saveCart(items);

    return items;
}
/* ==========================================================
   Remove Item
========================================================== */

export function removeFromCart(cartItemId) {
  const items = getCart().filter((item) => item.cartItemId !== cartItemId);
  saveCart(items);
  return items;
}

/* ==========================================================
   Cart Helpers
========================================================== */

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => {
    if (item.itemType === "print") return sum + item.copies;
    return sum + item.quantity;
  }, 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => {
    if (item.itemType === "print") {
      return sum + (Number.isFinite(item.totalPrice) ? item.totalPrice : 0);
    }
    return sum + item.price * item.quantity;
  }, 0);
}

/* ==========================================================
   Order History
========================================================== */

/** @returns {Array} */
export function getOrderHistory() {
  const raw = localStorage.getItem(getHistoryKey());
  return raw ? JSON.parse(raw) : [];
}

/**
 * @param {{ orderId: number, tokenNumber: string, items: Array, totalAmount: number, placedAt: string, status?: string }} order
 */
export function recordCompletedOrder(order) {
  const history = getOrderHistory();
  history.unshift({ status: "Completed", ...order });
  localStorage.setItem(getHistoryKey(), JSON.stringify(history));
  return history;
}