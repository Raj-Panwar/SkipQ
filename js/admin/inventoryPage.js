// js/admin/inventoryPage.js

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "./productApi.js";
import { showToast } from "../shared/toast.js";

const FILE_API = "http://localhost:8080/api/files";

const ADMIN_SESSION_KEY = "skipq_admin";
if (!sessionStorage.getItem(ADMIN_SESSION_KEY)) {
  window.location.href = "./login.html";
}

const statTotalProducts  = document.getElementById("statTotalProducts");
const statTotalStock     = document.getElementById("statTotalStock");
const statOutOfStock     = document.getElementById("statOutOfStock");
const statLowStock       = document.getElementById("statLowStock");
const productsTableBody  = document.getElementById("productsTableBody");
const addProductBtn      = document.getElementById("addProductBtn");
const logoutAdminBtn     = document.getElementById("logoutAdminBtn");

const productModalOverlay      = document.getElementById("productModalOverlay");
const productModalTitle        = document.getElementById("productModalTitle");
const productForm              = document.getElementById("productForm");
const productIdInput           = document.getElementById("productId");
const productNameInput         = document.getElementById("productName");
const productCategoryInput     = document.getElementById("productCategory");
const productDescriptionInput  = document.getElementById("productDescription");
const productPriceInput        = document.getElementById("productPrice");
const productStockInput        = document.getElementById("productStock");
const closeModalBtn            = document.getElementById("closeModalBtn");
const cancelModalBtn           = document.getElementById("cancelModalBtn");
const saveProductBtn           = document.getElementById("saveProductBtn");

const productImagePreviewImg         = document.getElementById("productImagePreviewImg");
const productImagePreviewPlaceholder = document.getElementById("productImagePreviewPlaceholder");
const productImageFileInput          = document.getElementById("productImageFileInput");
const productImageUploadBtn          = document.getElementById("productImageUploadBtn");
const productImageHint               = document.getElementById("productImageHint");

const DEFAULT_IMAGE_HINT = "JPG, PNG or WEBP · Max 5MB";
const NEW_PRODUCT_IMAGE_HINT = "Save the product first, then add an image.";

const deleteModalOverlay = document.getElementById("deleteModalOverlay");
const deleteModalText    = document.getElementById("deleteModalText");
const cancelDeleteBtn    = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn   = document.getElementById("confirmDeleteBtn");

let pendingDeleteId  = null;
let currentProducts  = [];

init();

function init() {
  renderAll();

  addProductBtn.addEventListener("click", openCreateModal);
  closeModalBtn.addEventListener("click", closeProductModal);
  cancelModalBtn.addEventListener("click", closeProductModal);
  productModalOverlay.addEventListener("click", (e) => {
    if (e.target === productModalOverlay) closeProductModal();
  });

  productForm.addEventListener("submit", handleProductFormSubmit);
  productsTableBody.addEventListener("click", handleTableClick);

  productImageUploadBtn.addEventListener("click", () => productImageFileInput.click());
  productImageFileInput.addEventListener("change", handleImageFileSelected);

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

async function renderAll() {
  setTableLoading(true);
  try {
    currentProducts = await getProducts();
  } catch (error) {
    showToast("Failed to load products: " + error.message, "error");
    setTableLoading(false);
    return;
  }
  renderStats(currentProducts);
  renderProductsTable(currentProducts);
  setTableLoading(false);
}

function setTableLoading(loading) {
  if (loading) {
    productsTableBody.innerHTML = `
      <tr class="table-empty"><td colspan="6">Loading products…</td></tr>`;
  }
}

/* ==========================================================
   Stats + low stock banner
========================================================== */

function renderStats(products) {
  statTotalProducts.textContent = String(products.length);

  statTotalStock.textContent = String(
    products.reduce((sum, p) => sum + (p.stock ?? 0), 0)
  );

  statOutOfStock.textContent = String(
    products.filter((p) => p.stockStatus === "OUT_OF_STOCK").length
  );

  statLowStock.textContent = String(
    products.filter((p) => p.stockStatus === "LOW_STOCK").length
  );
}
/* ==========================================================
   Products table
========================================================== */

function renderProductsTable(products) {
  if (products.length === 0) {
    productsTableBody.innerHTML = `
      <tr class="table-empty"><td colspan="6">No products yet. Click "Add product" to create one.</td></tr>`;
    return;
  }
  productsTableBody.replaceChildren(...products.map(buildProductRow));
}

function buildProductRow(product) {
  const tr    = document.createElement("tr");
  
  tr.dataset.productId = String(product.id);
const stock = product.stock ?? 0;
const stockStatus = product.stockStatus ?? "IN_STOCK";
switch (stockStatus) {
  case "OUT_OF_STOCK":
    tr.classList.add("inventory-row-out");
    break;

  case "LOW_STOCK":
    tr.classList.add("inventory-row-low");
    break;
}

let stockClass;
let stockLabel;

switch (stockStatus) {
  case "OUT_OF_STOCK":
    stockClass = "stock-pill-out";
    stockLabel = "Out of stock";
    break;

  case "LOW_STOCK":
    stockClass = "stock-pill-low";
    stockLabel = "Low stock";
    break;

  default:
    stockClass = "stock-pill-ok";
    stockLabel = "In stock";
}
  const status      = product.status ?? "ACTIVE";
  const statusClass = status === "ACTIVE" ? "badge-ready" : "badge-cancelled";
  const statusLabel = status === "ACTIVE" ? "Active"      : "Inactive";

  tr.innerHTML = `
    <td class="table-cell">
      <div class="table-product">
        ${product.imagePath
          ? `<img class="table-product-image" src="${FILE_API}/${product.imagePath}" alt="${product.name}" loading="lazy" decoding="async">`
          : `<span class="table-product-image-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>`
        }
        <div class="table-product-info">
          <span class="table-product-name">${product.name}</span>
          <span class="table-product-desc">${product.description ?? ""}</span>
        </div>
      </div>
    </td>
    <td class="table-cell">${product.category ?? ""}</td>
    <td class="table-cell"><span class="admin-amount">₹${product.price}</span></td>
    <td class="table-cell">
      <div class="stock-cell">
        <span class="stock-pill ${stockClass}">${stock} · ${stockLabel}</span>
        <div class="stock-inline-edit">
          <input type="number" class="stock-quick-input" min="0" value="${stock}"
            aria-label="Update stock for ${product.name}">
          <button type="button" class="btn btn-sm btn-secondary stock-update-btn">Update</button>
        </div>
      </div>
    </td>
    <td class="table-cell">
      <span class="badge ${statusClass}">${statusLabel}</span>
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

async function handleTableClick(event) {
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
    const input    = row.querySelector(".stock-quick-input");
    const newStock = Math.max(0, Number(input.value) || 0);
    const existing = currentProducts.find((p) => p.id === productId);
    if (!existing) return;

    const btn = event.target.closest(".stock-update-btn");
    btn.disabled = true;

    try {
      const updated = await updateProduct(productId, {
        name:        existing.name,
        category:    existing.category,
        description: existing.description,
        price:       existing.price,
        stock:       newStock,
        status:      existing.status,
      });
      showToast(`Stock updated — ${updated.name}: ${updated.stock} units`, "success");
      await renderAll();
    } catch (error) {
      showToast("Failed to update stock: " + error.message, "error");
      btn.disabled = false;
    }
  }
}

/* ==========================================================
   Add / Edit modal
========================================================== */

function openCreateModal() {
  productModalTitle.textContent = "Add product";
  productForm.reset();
  productIdInput.value = "";
  clearFormErrors();
  setImagePreview(null);
  setImageUploadEnabled(false, NEW_PRODUCT_IMAGE_HINT);
  productModalOverlay.hidden = false;
  productNameInput.focus();
}

function openEditModal(productId) {
  const product = currentProducts.find((p) => p.id === productId);
  if (!product) return;

  productModalTitle.textContent     = "Edit product";
  productIdInput.value              = String(product.id);
  productNameInput.value            = product.name;
  productCategoryInput.value        = product.category ?? "Notebooks";
  productDescriptionInput.value     = product.description ?? "";
  productPriceInput.value           = String(product.price);
  productStockInput.value           = String(product.stock ?? 0);

  const productStatusInput = document.getElementById("productStatus");
  if (productStatusInput) productStatusInput.value = product.status ?? "ACTIVE";

  setImagePreview(product.imagePath);
  setImageUploadEnabled(true, DEFAULT_IMAGE_HINT);
  productImageUploadBtn.textContent = product.imagePath ? "Replace image" : "Upload image";

  clearFormErrors();
  productModalOverlay.hidden = false;
  productNameInput.focus();
}

function closeProductModal() {
  productModalOverlay.hidden = true;
}

function clearFormErrors() {
  document.getElementById("productNameError").hidden  = true;
  document.getElementById("productPriceError").hidden = true;
  document.getElementById("productStockError").hidden = true;
}

async function handleProductFormSubmit(event) {
  event.preventDefault();
  clearFormErrors();

  const name   = productNameInput.value.trim();
  const price  = Number(productPriceInput.value);
  const stock  = Number(productStockInput.value);

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

  const productStatusInput = document.getElementById("productStatus");

  const payload = {
    name,
    category:    productCategoryInput.value,
    description: productDescriptionInput.value.trim(),
    price,
    stock,
    status:      productStatusInput ? productStatusInput.value : "ACTIVE",
  };

  const existingId = productIdInput.value;

  saveProductBtn.disabled = true;
  saveProductBtn.classList.add("is-loading");

  try {
    if (existingId) {
      await updateProduct(Number(existingId), payload);
      showToast(`${name} updated`, "success");
    } else {
      await createProduct(payload);
      showToast(`${name} added to catalog`, "success");
    }
    closeProductModal();
    await renderAll();
  } catch (error) {
    showToast((existingId ? "Failed to update" : "Failed to create") + " product: " + error.message, "error");
  } finally {
    saveProductBtn.disabled = false;
    saveProductBtn.classList.remove("is-loading");
  }
}

function showFieldError(id, message) {
  const el      = document.getElementById(id);
  el.textContent = message;
  el.hidden      = false;
}

/* ==========================================================
   Product image upload
========================================================== */

function setImagePreview(imagePath) {
  if (imagePath) {
    productImagePreviewImg.src    = `${FILE_API}/${imagePath}`;
    productImagePreviewImg.hidden = false;
    productImagePreviewPlaceholder.hidden = true;
  } else {
    productImagePreviewImg.hidden = true;
    productImagePreviewImg.src    = "";
    productImagePreviewPlaceholder.hidden = false;
  }
}

function setImageUploadEnabled(enabled, hint) {
  productImageUploadBtn.disabled = !enabled;
  productImageHint.textContent   = hint;
  if (enabled) {
    productImageUploadBtn.textContent = "Upload image";
  }
}

async function handleImageFileSelected() {
  const file = productImageFileInput.files[0];
  productImageFileInput.value = ""; // allow re-selecting the same file later

  if (!file) return;

  const productId = productIdInput.value;
  if (!productId) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    showToast("Only JPG, PNG or WEBP images are allowed.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("Image must be 5MB or smaller.", "error");
    return;
  }

  productImageUploadBtn.disabled = true;
  productImageUploadBtn.classList.add("is-loading");

  try {
    const updated = await uploadProductImage(Number(productId), file);

    setImagePreview(updated.imagePath);
    productImageUploadBtn.textContent = "Replace image";

    const index = currentProducts.findIndex((p) => p.id === updated.id);
    if (index !== -1) currentProducts[index] = updated;

    renderProductsTable(currentProducts);
    showToast("Product image updated", "success");
  } catch (error) {
    showToast("Failed to upload image: " + error.message, "error");
  } finally {
    productImageUploadBtn.disabled = false;
    productImageUploadBtn.classList.remove("is-loading");
  }
}

/* ==========================================================
   Delete modal
========================================================== */

function openDeleteModal(productId) {
  const product = currentProducts.find((p) => p.id === productId);
  if (!product) return;

  pendingDeleteId          = productId;
  deleteModalText.textContent =
    `This will permanently remove "${product.name}" from the catalog.`;
  deleteModalOverlay.hidden = false;
}

function closeDeleteModal() {
  deleteModalOverlay.hidden = true;
  pendingDeleteId = null;
}

async function handleConfirmDelete() {
  if (pendingDeleteId === null) return;

  const product = currentProducts.find((p) => p.id === pendingDeleteId);
  confirmDeleteBtn.disabled = true;

  try {
    await deleteProduct(pendingDeleteId);
    showToast(`${product?.name ?? "Product"} deleted`, "info");
    closeDeleteModal();
    await renderAll();
  } catch (error) {
    showToast("Failed to delete product: " + error.message, "error");
  } finally {
    confirmDeleteBtn.disabled = false;
  }
}