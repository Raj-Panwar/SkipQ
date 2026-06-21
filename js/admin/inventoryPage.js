// js/admin/inventoryPage.js
// Admin inventory page controller.
// Renders stats cards, the products table, and handles the
// add/edit/delete product modals. All mutations go through
// inventoryStore.js, which is the same module menuPage.js reads from —
// so changes made here are visible on the student menu immediately.

import {
  getAllProducts,
  getInventoryStats,
  getLowStockProducts,
  getOutOfStockProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  LOW_STOCK_THRESHOLD,
} from "./inventoryStore.js";
import { showToast } from "../shared/toast.js";

const ADMIN_SESSION_KEY = "skipq_admin_session";

//if (!sessionStorage.getItem(ADMIN_SESSION_KEY)) {
  //window.location.href = "./login.html";
//}

// Stats
const statTotalProducts = document.getElementById("statTotalProducts");
const statTotalStock    = document.getElementById("statTotalStock");
const statOutOfStock    = document.getElementById("statOutOfStock");
const statLowStock      = document.getElementById("statLowStock");

const lowStockBanner     = document.getElementById("lowStockBanner");
const lowStockBannerText = document.getElementById("lowStockBannerText");

const productsTableBody = document.getElementById("productsTableBody");
const addProductBtn     = document.getElementById("addProductBtn");
const logoutAdminBtn    = document.getElementById("logoutAdminBtn");

// Product modal
const productModalOverlay = document.getElementById("productModalOverlay");
const productModalTitle   = document.getElementById("productModalTitle");
const productForm         = document.getElementById("productForm");
const productIdInput      = document.getElementById("productId");
const productNameInput    = document.getElementById("productName");
const productCategoryInput = document.getElementById("productCategory");
const productDescriptionInput = document.getElementById("productDescription");
const productPriceInput   = document.getElementById("productPrice");
const productStockInput   = document.getElementById("productStock");
const productStatusInput  = document.getElementById("productStatus");
const closeModalBtn       = document.getElementById("closeModalBtn");
const cancelModalBtn      = document.getElementById("cancelModalBtn");

// Delete modal
const deleteModalOverlay = document.getElementById("deleteModalOverlay");
const deleteModalText    = document.getElementById("deleteModalText");
const cancelDeleteBtn    = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn   = document.getElementById("confirmDeleteBtn");

let pendingDeleteId = null;

init();

function init() {
  renderAll();
  cancelDeleteBtn.addEventListener("click", () => {
  console.log("Cancel button clicked");
});

confirmDeleteBtn.addEventListener("click", () => {
  console.log("Delete button clicked");
});

  addProductBtn.addEventListener("click", openCreateModal);
  closeModalBtn.addEventListener("click", closeProductModal);
  cancelModalBtn.addEventListener("click", closeProductModal);
  productModalOverlay.addEventListener("click", (e) => {
    if (e.target === productModalOverlay) closeProductModal();
  });

  productForm.addEventListener("submit", handleProductFormSubmit);
  productsTableBody.addEventListener("click", handleTableClick);

  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  deleteModalOverlay.addEventListener("click", (e) => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
  });

  logoutAdminBtn.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showToast("Logged out", "info", 1200);
    setTimeout(() => { window.location.href = "./login.html"; }, 900);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      closeDeleteModal();
    }
  });
}

function renderAll() {
  renderStats();
  renderLowStockBanner();
  renderProductsTable();
}

/* ==========================================================
   Stats + low stock banner
========================================================== */

function renderStats() {
  const stats = getInventoryStats();
  statTotalProducts.textContent = String(stats.totalProducts);
  statTotalStock.textContent = String(stats.totalStock);
  statOutOfStock.textContent = String(stats.outOfStockCount);
  statLowStock.textContent = String(stats.lowStockCount);
}

function renderLowStockBanner() {
  const lowStock = getLowStockProducts();
  const outOfStock = getOutOfStockProducts();
  const concerning = [...outOfStock, ...lowStock];

  if (concerning.length === 0) {
    lowStockBanner.hidden = true;
    return;
  }

  const names = concerning.slice(0, 3).map((p) => p.name).join(", ");
  const extra = concerning.length > 3 ? ` and ${concerning.length - 3} more` : "";

  lowStockBannerText.textContent =
    `${concerning.length} product${concerning.length === 1 ? "" : "s"} need attention: ${names}${extra}.`;
  lowStockBanner.hidden = false;
}

/* ==========================================================
   Products table
========================================================== */

function renderProductsTable() {
  const products = getAllProducts();

  if (products.length === 0) {
    productsTableBody.innerHTML = `
      <tr class="table-empty"><td colspan="6">No products yet. Click "Add product" to create one.</td></tr>`;
    return;
  }

  productsTableBody.replaceChildren(...products.map(buildProductRow));
}

function buildProductRow(product) {
  const tr = document.createElement("tr");
  tr.dataset.productId = String(product.id);

  const isOut = product.stock === 0;
  const isLow = product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD;
  const stockClass = isOut ? "stock-pill-out" : isLow ? "stock-pill-low" : "stock-pill-ok";
  const stockLabel = isOut ? "Out of stock" : isLow ? "Low stock" : "In stock";

  tr.innerHTML = `
    <td class="table-cell">
      <div class="table-product">
        <span class="table-product-image-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>
        <div class="table-product-info">
          <span class="table-product-name">${product.name}</span>
          <span class="table-product-desc">${product.description ?? ""}</span>
        </div>
      </div>
    </td>
    <td class="table-cell">${product.category}</td>
    <td class="table-cell"><span class="admin-amount">₹${product.price}</span></td>
    <td class="table-cell">
      <div class="stock-cell">
        <span class="stock-pill ${stockClass}">${product.stock} · ${stockLabel}</span>
        <div class="stock-inline-edit">
          <input type="number" class="stock-quick-input" min="0" value="${product.stock}"
            aria-label="Update stock for ${product.name}">
          <button type="button" class="btn btn-sm btn-secondary stock-update-btn">Update</button>
        </div>
      </div>
    </td>
    <td class="table-cell">
      <span class="badge ${product.status === "ACTIVE" ? "badge-ready" : "badge-cancelled"}">
        ${product.status === "ACTIVE" ? "Active" : "Inactive"}
      </span>
    </td>
    <td class="table-cell table-actions">
      <div class="action-btn-group">
        <button class="btn btn-sm btn-secondary edit-product-btn">Edit</button>
        <button class="btn btn-sm btn-danger delete-product-btn">Delete</button>
      </div>
    </td>
  `;

  return tr;
}

function handleTableClick(event) {
  const row = event.target.closest("tr");
  if (!row || !row.dataset.productId) return;
  const productId = Number(row.dataset.productId);

  if (event.target.closest(".edit-product-btn")) {
    openEditModal(productId);
    return;
  }

  if (event.target.closest(".delete-product-btn")) {
    openDeleteModal(productId);
    return;
  }

  if (event.target.closest(".stock-update-btn")) {
    const input = row.querySelector(".stock-quick-input");
    const newStock = Math.max(0, Number(input.value) || 0);
    const product = updateProduct(productId, { stock: newStock });
    if (product) {
      showToast(`Stock updated — ${product.name}: ${product.stock} units`, "success");
      renderAll();
    }
  }
}

/* ==========================================================
   Add / Edit modal
========================================================== */

function openCreateModal() {
  // Close delete modal if open
  closeDeleteModal();

  productModalTitle.textContent = "Add product";
  productForm.reset();
  productIdInput.value = "";
  productStatusInput.value = "ACTIVE";

  clearFormErrors();

  productModalOverlay.hidden = false;
  productNameInput.focus();
}

function openEditModal(productId) {
  // Close delete modal if open
  closeDeleteModal();

  const product = getAllProducts().find((p) => p.id === productId);
  if (!product) return;

  productModalTitle.textContent = "Edit product";

  productIdInput.value = String(product.id);
  productNameInput.value = product.name;
  productCategoryInput.value = product.category;
  productDescriptionInput.value = product.description ?? "";
  productPriceInput.value = String(product.price);
  productStockInput.value = String(product.stock);
  productStatusInput.value = product.status;

  clearFormErrors();

  productModalOverlay.hidden = false;
  productNameInput.focus();
}

function closeProductModal() {
  productModalOverlay.hidden = true;
}

function clearFormErrors() {
  document.getElementById("productNameError").hidden = true;
  document.getElementById("productPriceError").hidden = true;
  document.getElementById("productStockError").hidden = true;
}

function handleProductFormSubmit(event) {
  event.preventDefault();
  clearFormErrors();

  const name = productNameInput.value.trim();
  const price = Number(productPriceInput.value);
  const stock = Number(productStockInput.value);

  let valid = true;
  if (!name) {
    showFieldError("productNameError", "Product name is required.");
    valid = false;
  }
  if (!Number.isFinite(price) || price < 0) {
    showFieldError("productPriceError", "Enter a valid price.");
    valid = false;
  }
  if (!Number.isFinite(stock) || stock < 0) {
    showFieldError("productStockError", "Enter a valid stock quantity.");
    valid = false;
  }
  if (!valid) return;

  const data = {
    name,
    category: productCategoryInput.value,
    description: productDescriptionInput.value.trim(),
    price,
    stock,
    status: productStatusInput.value,
  };

  const existingId = productIdInput.value;

  if (existingId) {
    updateProduct(Number(existingId), data);
    showToast(`${name} updated`, "success");
  } else {
    createProduct(data);
    showToast(`${name} added to catalog`, "success");
  }

  closeProductModal();
  renderAll();
}

function showFieldError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.hidden = false;
}

/* ==========================================================
   Delete modal
========================================================== */

function openDeleteModal(productId) {
  // Close product modal first
  closeProductModal();

  const product = getAllProducts().find((p) => p.id === productId);
  if (!product) return;

  pendingDeleteId = productId;

  deleteModalText.textContent =
    `This will permanently remove "${product.name}" from the catalog.`;

  deleteModalOverlay.hidden = false;
}

function closeDeleteModal() {
  deleteModalOverlay.hidden = true;
  pendingDeleteId = null;
}

function handleConfirmDelete() {
  if (pendingDeleteId === null) return;

  const product = getAllProducts().find(
    (p) => p.id === pendingDeleteId
  );

  const removed = deleteProduct(pendingDeleteId);

  if (removed) {
    showToast(
      `${product?.name ?? "Product"} deleted`,
      "success"
    );
  }

  deleteModalOverlay.hidden = true;
  pendingDeleteId = null;

  renderAll();
}