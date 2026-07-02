// js/student/cartPage.js
// CHANGED: the + button handler now shows a more specific toast
// ("Maximum available stock reached") when the student tries to
// exceed live stock. The actual clamping is handled in cartStore.js
// setQuantity() which uses getProductById() from inventoryStore.
// All other logic (checkout, print rows, stationery rows, summary,
// remove) is unchanged.

import {
    getCart,
    setQuantity,
    setPrintCopies,
    removeFromCart,
    clearCart
} from "./cartStore.js";
import { createOrder } from "./orderApi.js";
import { getSession, requireAuth } from "../shared/auth.js";
import { formatCurrency } from "../utils/formatters.js";
import { showToast } from "../shared/toast.js";
import { initStudentNav } from "../shared/nav.js";

requireAuth();

const cartItemsList    = document.getElementById("cartItemsList");
const emptyCartState   = document.getElementById("emptyCartState");
const orderSummaryCard = document.getElementById("orderSummaryCard");
const summarySubtotal  = document.getElementById("summarySubtotal");
const summaryItemCount = document.getElementById("summaryItemCount");
const summaryTotal     = document.getElementById("summaryTotal");
const checkoutBtn      = document.getElementById("checkoutBtn");

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
    ...items.map((i) => i.itemType === "print" ? buildPrintRow(i) : buildStationeryRow(i))
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
        <path d="M7 8V4h10v4M6 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="6" y="14" width="12" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="cart-item-details">
      <span class="product-category-tag">Print</span>
      <h3 class="cart-item-name">${truncate(item.fileName, 28)}</h3>
      <span class="print-item-meta">
        ${item.pages ?? 1} pg × ${item.copies} ${item.copies === 1 ? "copy" : "copies"}
        · ${colorLabel} · ${sidedLabel} · ${item.paperSize}
      </span>
    </div>
    <div class="cart-item-controls">

  <div class="qty-selector">
      <button
          type="button"
          class="qty-step"
          data-direction="decrease"
          aria-label="Decrease copies">
          −
      </button>

      <span class="qty-value">
          ${item.copies}
      </span>

      <button
          type="button"
          class="qty-step"
          data-direction="increase"
          aria-label="Increase copies">
          +
      </button>
  </div>

  <span class="cart-item-subtotal">
      ${formatCurrency(item.totalPrice)}
  </span>

  <button
      type="button"
      class="remove-item-btn"
      aria-label="Remove ${item.fileName}">
      Remove
  </button>

</div>`;
  return row;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

async function handleListClick(event) {
  const row = event.target.closest(".cart-item-row");
  if (!row) return;
  const cartItemId = row.dataset.cartItemId;

  const stepBtn = event.target.closest(".qty-step");
  if (stepBtn) {
    const direction = stepBtn.dataset.direction === "increase" ? 1 : -1;
    const items     = getCart();
    const item      = items.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    if (item.itemType === "stationery") {

    const beforeQty = item.quantity;

    await setQuantity(
        cartItemId,
        item.quantity + direction
    );

    const afterItem = getCart().find(
        i => i.cartItemId === cartItemId
    );

    const afterQty = afterItem
        ? afterItem.quantity
        : 0;

    render();

    if (direction === 1 && afterQty === beforeQty) {
        showToast("Maximum available stock reached.", "warning");
    }

    return;
}

if (item.itemType === "print") {

    setPrintCopies(
        cartItemId,
        item.copies + direction
    );

    render();
    return;
}
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
  const count = items.reduce((s, i) => s + (i.itemType === "print" ? i.copies : i.quantity), 0);
  const total = items.reduce((s, i) => s + (i.itemType === "print" ? i.totalPrice : i.price * i.quantity), 0);
  summaryItemCount.textContent = String(count);
  summarySubtotal.textContent  = formatCurrency(total);
  summaryTotal.textContent     = formatCurrency(total);
}

async function handleCheckout() {
  const items = getCart();
  if (items.length === 0) return;


  const student     = getSession();
  if (!student) {
    showToast("Please login again.", "error");
    window.location.href = "./login.html";
    return;
}
const payload = {
    studentId: student.id,
    studentName: student.fullName,

    items: items.map(item => {

        if (item.itemType === "print") {

            return {
                itemType: "print",
                fileName: item.fileName,
originalFileName: item.originalFileName,
                pages: item.pages,
                copies: item.copies,
                colorMode: item.colorMode,
                sided: item.sided,
                paperSize: item.paperSize,
                totalPrice: item.totalPrice
            };

        }

        return {
            itemType: "stationery",
            productId: item.productId,
            quantity: item.quantity
        };

    })
};
  setCheckoutLoading(true);

  let createdOrder;
  try {

    createdOrder = await createOrder(payload);

    sessionStorage.setItem(
        "skipq_latest_order",
        JSON.stringify(createdOrder)
    );

    clearCart();

    render();

    showToast(
        "Order placed successfully!",
        "success"
    );

    setTimeout(() => {
        window.location.href = "./token.html";
    }, 700);

}
catch(error){

    showToast(
        error.message || "Checkout failed.",
        "error"
    );

}
finally{

    setCheckoutLoading(false);

}

}
function setCheckoutLoading(on) {
    checkoutBtn.disabled = on;
    checkoutBtn.classList.toggle("is-loading", on);

    const label = checkoutBtn.querySelector(".btn-label");

    if (label) {
        label.textContent = on
            ? "Placing order..."
            : "Checkout & Get Token";
    } else {
        checkoutBtn.textContent = on
            ? "Placing order..."
            : "Checkout & Get Token";
    }
}