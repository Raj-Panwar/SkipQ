// js/student/cartPage.js
import { getCart, setQuantity, removeFromCart, clearCart, recordCompletedOrder } from "./cartStore.js";
import { decrementStockForOrder } from "../admin/inventoryStore.js";
import { isAuthenticated } from "../auth/tokenStorage.js";
import { formatCurrency } from "../utils/formatters.js";
import { showToast } from "../shared/toast.js";
import { initStudentNav } from "../shared/nav.js";

const cartItemsList    = document.getElementById("cartItemsList");
const emptyCartState   = document.getElementById("emptyCartState");
const orderSummaryCard = document.getElementById("orderSummaryCard");
const summarySubtotal  = document.getElementById("summarySubtotal");
const summaryItemCount = document.getElementById("summaryItemCount");
const summaryTotal     = document.getElementById("summaryTotal");
const checkoutBtn      = document.getElementById("checkoutBtn");

const DEV_MODE = true;
if (!DEV_MODE && !isAuthenticated()) {
  window.location.href = "./login.html";
}

initStudentNav("cart");
render();

cartItemsList.addEventListener("click", handleListClick);
checkoutBtn.addEventListener("click", handleCheckout);

function render() {
  const items = getCart();
  if (items.length === 0) {
    cartItemsList.replaceChildren();
    emptyCartState.hidden = false;
    orderSummaryCard.hidden = true;
    return;
  }
  emptyCartState.hidden = true;
  orderSummaryCard.hidden = false;
  cartItemsList.replaceChildren(
    ...items.map((item) => item.itemType === "print" ? buildPrintRow(item) : buildStationeryRow(item))
  );
  updateSummary(items);
}

function buildStationeryRow(item) {
  const row = document.createElement("article");
  row.className = "cart-item-row card";
  row.dataset.cartItemId = item.cartItemId;
  row.innerHTML = `
    <div class="cart-item-image-placeholder" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="cart-item-details">
      <span class="product-category-tag">${item.category}</span>
      <h3 class="cart-item-name">${item.name}</h3>
      <span class="cart-item-unit-price">${formatCurrency(item.price)} each</span>
    </div>
    <div class="cart-item-controls">
      <div class="qty-selector">
        <button type="button" class="qty-step" data-direction="decrease" aria-label="Decrease quantity">−</button>
        <span class="qty-value">${item.quantity}</span>
        <button type="button" class="qty-step" data-direction="increase" aria-label="Increase quantity">+</button>
      </div>
      <span class="cart-item-subtotal">${formatCurrency(item.price * item.quantity)}</span>
      <button type="button" class="remove-item-btn" aria-label="Remove ${item.name}">Remove</button>
    </div>`;
  return row;
}

function buildPrintRow(item) {
  const row = document.createElement("article");
  row.className = "cart-item-row cart-item-row-print card";
  row.dataset.cartItemId = item.cartItemId;
  const colorLabel = item.colorMode === "COLOR" ? "Color" : "B/W";
  const sidedLabel = item.sided === "DOUBLE" ? "Double-sided" : "Single-sided";
  row.innerHTML = `
    <div class="cart-item-image-placeholder cart-item-image-placeholder-print" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 8V4h10v4M6 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="6" y="14" width="12" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="cart-item-details">
      <span class="product-category-tag">Print Documents</span>
      <h3 class="cart-item-name" title="${item.fileName}">${truncate(item.fileName, 28)}</h3>
      <span class="print-item-meta">
        ${item.pages ?? 1} pg × ${item.copies} ${item.copies === 1 ? "copy" : "copies"} · ${colorLabel} · ${sidedLabel} · ${item.paperSize}
      </span>
    </div>
    <div class="cart-item-controls">
      <span class="cart-item-subtotal">${formatCurrency(item.totalPrice)}</span>
      <button type="button" class="remove-item-btn" aria-label="Remove ${item.fileName}">Remove</button>
    </div>`;
  return row;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function handleListClick(event) {
  const row = event.target.closest(".cart-item-row");
  if (!row) return;
  const cartItemId = row.dataset.cartItemId;

  const stepBtn = event.target.closest(".qty-step");
  if (stepBtn) {
    const direction = stepBtn.dataset.direction === "increase" ? 1 : -1;
    const item = getCart().find((i) => i.cartItemId === cartItemId);
    if (!item || item.itemType !== "stationery") return;

    const before = item.quantity;
    setQuantity(cartItemId, item.quantity + direction);
    render();

    // setQuantity() clamps to live stock — if asking to increase did
    // nothing, the student has hit the stock ceiling. Tell them why.
    if (direction === 1) {
      const after = getCart().find((i) => i.cartItemId === cartItemId);
      if (!after || after.quantity === before) {
        showToast(`Only ${before} in stock for ${item.name}`, "warning");
      }
    }
    return;
  }

  const removeBtn = event.target.closest(".remove-item-btn");
  if (removeBtn) {
    const item = getCart().find((i) => i.cartItemId === cartItemId);
    removeFromCart(cartItemId);
    render();
    showToast(`${item?.name ?? "Item"} removed`, "info");
  }
}

function updateSummary(items) {
  const itemCount = items.reduce(
    (s, i) => s + (i.itemType === "print" ? i.copies : i.quantity), 0
  );
  const total = items.reduce(
    (s, i) => s + (i.itemType === "print" ? i.totalPrice : i.price * i.quantity), 0
  );
  summaryItemCount.textContent = String(itemCount);
  summarySubtotal.textContent = formatCurrency(total);
  summaryTotal.textContent = formatCurrency(total);
}

/**
 * Checkout: simulates order placement, decrements live inventory stock
 * for every stationery line item (NEW — see decrementStockForOrder),
 * records order history, clears the cart, and redirects to token.html.
 *
 * Because inventoryStore.js is the same module the menu page reads from,
 * the stock reduction is visible immediately on menu.html on next render
 * and on admin/inventory.html on next render — no extra sync step needed.
 */
function handleCheckout() {
  const items = getCart();
  if (items.length === 0) return;

  checkoutBtn.disabled = true;
  checkoutBtn.classList.add("is-loading");

  setTimeout(() => {
    const totalAmount = items.reduce(
      (s, i) => s + (i.itemType === "print" ? i.totalPrice : i.price * i.quantity), 0
    );
    const orderItems = items.map((i) =>
      i.itemType === "print"
        ? { name: i.fileName, quantity: i.copies, price: i.totalPrice / i.copies }
        : { name: i.name, quantity: i.quantity, price: i.price }
    );
    const simulatedOrder = {
      orderId: Math.floor(Math.random() * 900) + 100,
      tokenNumber: `#0${Math.floor(Math.random() * 40) + 50}`,
      items: orderItems,
      totalAmount,
      placedAt: new Date().toISOString(),
    };

    // NEW: reduce stock for every stationery item before finalizing.
    decrementStockForOrder(items);

    sessionStorage.setItem("skipq_latest_order", JSON.stringify(simulatedOrder));
    recordCompletedOrder(simulatedOrder);
    clearCart();

    showToast(`Order placed! Your token is ${simulatedOrder.tokenNumber}`, "success", 4000);
    setTimeout(() => { window.location.href = "./token.html"; }, 800);
  }, 600);
}