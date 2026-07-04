// js/student/menuPage.js
// CHANGED in this file (search CHANGED comments):
//   1. adjustQuantitySelector — removed Math.min(10, ...) cap.
//      Max quantity is now product.stock directly (no artificial ceiling).
//   2. handleAddToCart — computes remaining available stock as
//      (backend stock − qty already in cart) and enforces that limit.
//      Shows a specific toast when the student hits the ceiling.
//   3. buildProductCard — quantity display no longer clamped to 10;
//      uses selectedQuantities value directly (already bounded by stock
//      in adjustQuantitySelector).
// Everything else (auth guard, product loading, filtering, search,
// print jobs, cart summary bar, sticky bar) is unchanged.

import { getMenuProducts } from "./menuApi.js";
import {
  getCurrentServingToken,
  getCurrentWaitEstimate
} from "./orderApi.js";
import { addToCart, addPrintJob, getCartCount, getCartTotal, getCart } from "./cartStore.js";
import { getSession, requireAuth } from "../shared/auth.js";
import { formatCurrency } from "../utils/formatters.js";
import { showToast } from "../shared/toast.js";
import { initStudentNav } from "../shared/nav.js";
import { initNotifications } from "./notification.js";
const LOW_STOCK_THRESHOLD = 10;
const FILE_UPLOAD_API = "http://localhost:8080/api/files/upload";
const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryTabs = document.getElementById("categoryTabs");
const welcomeGreeting = document.getElementById("welcomeGreeting");
const currentServingText = document.getElementById("currentServingToken");
const estimatedWaitText = document.getElementById("estimated-wait-time");
const cartBadge = document.getElementById("cartBadge");
const cartSummaryBar = document.getElementById("cartSummaryBar");
const cartSummaryCount = document.getElementById("cartSummaryCount");
const cartSummaryTotal = document.getElementById("cartSummaryTotal");

requireAuth();

let activeCategory = "All";
let searchTerm = "";
let allProducts = [];
const selectedQuantities = new Map();

init();

async function init() {
  initStudentNav("menu");
  const student = getSession();

  if (student) {
    initNotifications(student.id);
  }


  if (student?.fullName) {
    welcomeGreeting.textContent = `Welcome back, ${student.fullName.split(" ")[0]}`;

  }
  

  async function loadCurrentServing() {

    try {

      const token = await getCurrentServingToken();

      currentServingText.textContent =
        `#${String(token).padStart(3, "0")}`;

    } catch (e) {

      currentServingText.textContent =
        "Loading...";

    }

  }
  async function loadEstimatedWait() {

  try {

    const data = await getCurrentWaitEstimate();

    if (data.estimatedWaitMinutes == null) {
      estimatedWaitText.textContent = "Calculating...";
      return;
    }

    if (data.ordersAhead === 0) {
      estimatedWaitText.textContent = "No waiting";
      return;
    }

    estimatedWaitText.textContent =
      `≈ ${data.estimatedWaitMinutes} min wait`;

  } catch (e) {

    estimatedWaitText.textContent = "--";

  }

}
  await loadCurrentServing();
  setInterval(loadCurrentServing, 1000);

  await loadEstimatedWait();
  setInterval(loadEstimatedWait, 30000);

  updateCartUI();
  setGridLoading(true);

  try {
    const fetched = await getMenuProducts();
    allProducts = fetched.filter((p) => p.status === "ACTIVE");
  } catch (error) {
    showToast("Could not load products. Please check your connection.", "error");
    setGridLoading(false);
    return;
  }

  renderProducts();
  updateCartUI();

  searchInput.addEventListener("input", handleSearch);
  categoryTabs.addEventListener("click", handleCategoryClick);
  productGrid.addEventListener("click", handleGridClick);

  // window.addEventListener("focus", refreshProducts);
  

}

async function refreshProducts() {
  try {
    const fetched = await getMenuProducts();
    allProducts = fetched.filter((p) => p.status === "ACTIVE");
    renderProducts();
    updateCartUI();
  } catch { /* silent background refresh failure */ }
}

function setGridLoading(loading) {
  if (loading) {
    productGrid.innerHTML = `<p class="empty-state">Loading products…</p>`;
    emptyState.hidden = true;
  }
}

function handleSearch(event) {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
}

function handleCategoryClick(event) {
  const chip = event.target.closest(".category-chip");
  if (!chip) return;
  activeCategory = chip.dataset.category;
  categoryTabs.querySelectorAll(".category-chip").forEach((el) => {
    el.classList.toggle("is-active", el === chip);
  });
  renderProducts();
}
async function uploadPdf(file) {

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(FILE_UPLOAD_API, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("PDF upload failed.");
  }

  return await response.json();
}
async function handleGridClick(event) {
  const stepBtn = event.target.closest(".qty-step");
  if (stepBtn) {
    const card = stepBtn.closest(".product-card");
    const productId = Number(card.dataset.productId);
    const direction = stepBtn.dataset.direction === "increase" ? 1 : -1;
    adjustQuantitySelector(card, productId, direction);
    return;
  }

  const addBtn = event.target.closest(".add-to-cart-btn");
  if (addBtn) {
    const card = addBtn.closest(".product-card");
    const productId = Number(card.dataset.productId);
    handleAddToCart(productId, card);
    return;
  }

  const printBtn = event.target.closest(".add-print-job-btn");
  if (printBtn) {
    const card = printBtn.closest(".product-card");
    const fileInput = card.querySelector(".print-file-input");
    const file = fileInput.files[0];
    if (!file) {
      showToast("Please upload a PDF before adding to cart.", "warning");
      return;
    }
    const copies = Number(card.querySelector(".print-copies").value) || 1;
    const sided = card.querySelector(".print-sided").value.toUpperCase();
    const productId = Number(card.dataset.productId);
    const product = allProducts.find((p) => p.id === productId);
    const pageCount = getMockPageCount(file);
    const colorMode = product.name.toLowerCase().includes("color") ? "COLOR" : "BW";
    const pricePerPage = colorMode === "COLOR" ? 10 : 2;
    try {

      const uploadResult = await uploadPdf(file);

      addPrintJob({
        fileName: uploadResult.fileName,
        originalFileName: file.name,
        pages: pageCount,
        copies,
        colorMode,
        sided,
        paperSize: "A4",
        totalPrice: pricePerPage * pageCount * copies,
      });

      updateCartUI();

      showToast(
        "Print job added successfully.",
        "success"
      );

    }
    catch (error) {

      showToast(
        "Failed to upload PDF.",
        "error"
      );

    }
    updateCartUI();
    showToast(`Print job added — ${copies} × ${file.name}`, "success");
  }
}

function getMockPageCount(file) {
  // 60 here is a PDF page count cap, not a product quantity limit.
  return Math.min(60, Math.max(1, Math.round(file.size / 45000) || 1));
}

/**
 * CHANGED: removed the hardcoded Math.min(10, product.stock) cap.
 * The only upper bound is product.stock from the backend.
 */
function adjustQuantitySelector(card, productId, direction) {
  const product = allProducts.find((p) => p.id === productId);

  const cartItem = getCart().find(
    i => i.itemType === "stationery" && i.productId === productId
  );

  const alreadyInCart = cartItem ? cartItem.quantity : 0;

  const maxQty = Math.max(0, (product?.stock ?? 0) - alreadyInCart);

  const current = selectedQuantities.get(productId) ?? 1;
  const next = Math.min(maxQty, Math.max(1, current + direction));
  selectedQuantities.set(productId, next);

  const el = card.querySelector(".qty-value");
  if (el) el.textContent = String(next);

  // Tell the student when they've reached the stock ceiling
  if (direction === 1 && next === current) {
    showToast(`Only ${maxQty} more available.`, "warning");
  }
}

/**
 * CHANGED: remaining available stock =
 *   backend stock − quantity already in the cart for this product.
 * This means the student can never add more total units than exist.
 */
async function handleAddToCart(productId, card) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product || (product.stock ?? 0) === 0) return;

  const requested = selectedQuantities.get(productId) ?? 1;

  // How many of this product are already sitting in the cart?
  const cartItems = getCart();
  const inCartItem = cartItems.find(
    (i) => i.itemType === "stationery" && i.productId === productId
  );
  const alreadyInCart = inCartItem ? inCartItem.quantity : 0;

  // CHANGED: remaining = backend stock − what's already in cart
  const remaining = (product.stock ?? 0) - alreadyInCart;

  if (remaining <= 0) {
    showToast(`All available stock of ${product.name} is already in your cart.`, "warning");
    return;
  }

  // Clamp the requested quantity to what's actually still available
  const quantity = Math.min(requested, remaining);

  if (quantity < requested) {
    showToast(
      `Only ${remaining} more available in stock. Adding ${quantity}.`,
      "warning"
    );
  }

  await addToCart(product, quantity);
  updateCartUI();
  renderProducts();


  selectedQuantities.set(productId, 1);
  showToast(`${product.name} added to cart`, "success");
}

function getFilteredProducts() {
  return allProducts.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm) ||
      (p.description ?? "").toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const filtered = getFilteredProducts();
  if (filtered.length === 0) {
    productGrid.replaceChildren();
    emptyState.hidden = false;
    emptyState.textContent =
      activeCategory !== "All" && searchTerm
        ? `No results for "${searchTerm}" in ${activeCategory}.`
        : activeCategory !== "All"
          ? `No products in ${activeCategory} right now.`
          : `No products found for "${searchTerm}".`;
    return;
  }
  emptyState.hidden = true;
  productGrid.replaceChildren(...filtered.map(buildProductCard));
}

function buildProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.productId = String(product.id);

  const stock = product.stock ?? 0;
  const isOut = stock === 0;
  const isLow = stock > 0 && stock < LOW_STOCK_THRESHOLD;

  // CHANGED: quantity display is now just the stored selector value,
  // not clamped to 10. The selector itself is bounded to stock via
  // adjustQuantitySelector(), so this is always valid.
  const quantity = selectedQuantities.get(product.id) ?? 1;

  const isPrinting = product.name === "B&W Printout" || product.name === "Color Printout";
  const showsStock = !isPrinting;

  card.innerHTML = `
    <div class="product-image-placeholder" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="product-card-body">
      <span class="product-category-tag">${product.category ?? ""}</span>
      <h3 class="product-name">${product.name}</h3>
      <p class="product-description">${product.description ?? ""}</p>
      <div class="product-card-footer">
        <span class="product-price">${formatCurrency(product.price)}</span>
        ${showsStock
      ? `<span class="stock-status ${isOut ? "is-out" : isLow ? "is-low" : "is-in"}">
               ${isOut ? "Out of stock" : isLow ? `Only ${stock} left` : `${stock} in stock`}
             </span>`
      : `<span class="stock-status is-in">Available</span>`
    }
      </div>
      ${isPrinting ? `
        <div class="print-upload-section">
          <input type="file" accept=".pdf" class="print-file-input">
          <label>Copies</label>
          <input type="number" min="1" value="1" class="input print-copies">
          <label>Print Type</label>
          <select class="print-sided">
            <option value="single">Single Sided</option>
            <option value="double">Double Sided</option>
          </select>
          <button type="button" class="btn btn-primary add-print-job-btn">Add Print Job</button>
        </div>
      ` : `
        <div class="product-card-actions">
          <div class="qty-selector ${isOut ? "is-disabled" : ""}">
            <button type="button" class="qty-step" data-direction="decrease" ${isOut ? "disabled" : ""}>−</button>
            <span class="qty-value">${quantity}</span>
            <button type="button" class="qty-step" data-direction="increase" ${isOut ? "disabled" : ""}>+</button>
          </div>
          <button type="button" class="btn btn-primary add-to-cart-btn" ${isOut ? "disabled" : ""}>
            ${isOut ? "Out of Stock" : "Add to cart"}
          </button>
        </div>
      `}
    </div>`;
  return card;
}

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();
  if (count > 0) {
    cartBadge.textContent = String(count);
    cartBadge.hidden = false;
    cartSummaryBar.hidden = false;
    cartSummaryCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
    cartSummaryTotal.textContent = formatCurrency(total);
  } else {
    cartBadge.hidden = true;
    cartSummaryBar.hidden = true;
  }
}