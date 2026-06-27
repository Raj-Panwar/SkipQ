// js/student/menuPage.js

import { getMenuProducts } from "./menuApi.js";
import { addToCart, addPrintJob, getCartCount, getCartTotal } from "./cartStore.js";
import { getSession, isLoggedIn } from "../shared/auth.js";
import { formatCurrency } from "../utils/formatters.js";
import { showToast } from "../shared/toast.js";
import { initStudentNav } from "../shared/nav.js";

const LOW_STOCK_THRESHOLD = 10;

const productGrid     = document.getElementById("productGrid");
const emptyState      = document.getElementById("emptyState");
const searchInput     = document.getElementById("searchInput");
const categoryTabs    = document.getElementById("categoryTabs");
const welcomeGreeting = document.getElementById("welcomeGreeting");

const cartBadge        = document.getElementById("cartBadge");
const cartSummaryBar   = document.getElementById("cartSummaryBar");
const cartSummaryCount = document.getElementById("cartSummaryCount");
const cartSummaryTotal = document.getElementById("cartSummaryTotal");

if (!isLoggedIn()) {
  window.location.href = "./login.html";
}

let activeCategory  = "All";
let searchTerm      = "";
let allProducts     = [];
const selectedQuantities = new Map();

init();

async function init() {
  initStudentNav("menu");

  const user = getSession();

if (user?.fullName) {
    welcomeGreeting.textContent =
        `Welcome back, ${firstName(user.fullName)}`;
}

  updateCartUI();
  setGridLoading(true);

  try {
    const fetched = await getMenuProducts();
    // Show only ACTIVE products on the student menu
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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        refreshProducts();
    }
});
}

async function refreshProducts() {
  try {
    const fetched = await getMenuProducts();
    allProducts = fetched.filter((p) => p.status === "ACTIVE");
    renderProducts();
    updateCartUI();
  } catch {
    // Silent refresh failure — do not toast on background refresh
  }
}

function firstName(fullName) {
  return fullName.trim().split(" ")[0];
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

function handleGridClick(event) {
  const stepBtn = event.target.closest(".qty-step");
  if (stepBtn) {
    const card      = stepBtn.closest(".product-card");
    const productId = Number(card.dataset.productId);
    const direction = stepBtn.dataset.direction === "increase" ? 1 : -1;
    adjustQuantitySelector(card, productId, direction);
    return;
  }

  const addBtn = event.target.closest(".add-to-cart-btn");
  if (addBtn) {
    const card      = addBtn.closest(".product-card");
    const productId = Number(card.dataset.productId);
    handleAddToCart(productId, card);
    return;
  }

  const printBtn = event.target.closest(".add-print-job-btn");
  if (printBtn) {
    const card      = printBtn.closest(".product-card");
    const fileInput = card.querySelector(".print-file-input");
    const file      = fileInput.files[0];

    if (!file) {
      showToast("Please upload a PDF before adding to cart.", "warning");
      return;
    }

    const copies    = Number(card.querySelector(".print-copies").value) || 1;
    const sidedRaw  = card.querySelector(".print-sided").value;
    const sided     = sidedRaw.toUpperCase();
    const productId = Number(card.dataset.productId);
    const product   = allProducts.find((p) => p.id === productId);

    const pageCount    = getMockPageCountFromFile(file);
    const colorMode    = product.name.toLowerCase().includes("color") ? "COLOR" : "BW";
    const pricePerPage = colorMode === "COLOR" ? 10 : 2;
    const totalPrice   = pricePerPage * pageCount * copies;

    addPrintJob({ fileName: file.name, pages: pageCount, copies, colorMode, sided, paperSize: "A4", totalPrice });
    updateCartUI();
    showToast(`Print job added — ${copies} × ${file.name}`, "success");
  }
}

function getMockPageCountFromFile(file) {
  const estimated = Math.round(file.size / 45000);
  return Math.min(60, Math.max(1, estimated || 1));
}

function adjustQuantitySelector(card, productId, direction) {
  const product = allProducts.find((p) => p.id === productId);
  const maxQty  = product ? Math.min(10, product.stock ?? 10) : 10;
  const current = selectedQuantities.get(productId) ?? 1;
  const next    = Math.min(maxQty, Math.max(1, current + direction));
  selectedQuantities.set(productId, next);

  const qtyValueEl = card.querySelector(".qty-value");
  if (qtyValueEl) qtyValueEl.textContent = String(next);

  if (direction === 1 && next === current && current >= maxQty) {
    showToast(`Only ${product.stock} in stock`, "warning");
  }
}

function handleAddToCart(productId, card) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product || (product.stock ?? 0) === 0) return;

  const quantity = Math.min(selectedQuantities.get(productId) ?? 1, product.stock ?? 1);
  addToCart(product, quantity);
  updateCartUI();
  renderProducts();

  selectedQuantities.set(productId, 1);
  showToast(`${product.name} added to cart`, "success");
}

function getFilteredProducts() {
  return allProducts.filter((product) => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description ?? "").toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  console.trace("RENDER PRODUCTS");
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

  const stock      = product.stock ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock   = stock > 0 && stock < LOW_STOCK_THRESHOLD;
  const quantity     = Math.min(selectedQuantities.get(product.id) ?? 1, Math.max(1, stock));

  const isPrinting =
    product.name === "B&W Printout" || product.name === "Color Printout";

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
        ${showsStock ? `
          <span class="stock-status ${isOutOfStock ? "is-out" : isLowStock ? "is-low" : "is-in"}">
            ${isOutOfStock ? "Out of stock" : isLowStock ? `Only ${stock} left` : `${stock} in stock`}
          </span>
        ` : `
          <span class="stock-status is-in">Available</span>
        `}
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
          <button type="button" class="btn btn-primary add-print-job-btn">
            Add Print Job
          </button>
        </div>
      ` : `
        <div class="product-card-actions">
          <div class="qty-selector ${isOutOfStock ? "is-disabled" : ""}">
            <button type="button" class="qty-step" data-direction="decrease"
              ${isOutOfStock ? "disabled" : ""}>−</button>
            <span class="qty-value">${quantity}</span>
            <button type="button" class="qty-step" data-direction="increase"
              ${isOutOfStock ? "disabled" : ""}>+</button>
          </div>
          <button type="button" class="btn btn-primary add-to-cart-btn"
            ${isOutOfStock ? "disabled" : ""}>
            ${isOutOfStock ? "Out of Stock" : "Add to cart"}
          </button>
        </div>
      `}
    </div>
  `;

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