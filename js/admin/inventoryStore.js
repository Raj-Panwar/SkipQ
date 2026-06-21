// js/admin/inventoryStore.js
//
// Single source of truth for SkipQ's product catalog and stock levels.
// Backed by localStorage for this frontend-only phase.
//
// IMPORTANT — architecture note for the future backend integration:
// Every function here is written to mirror what its Spring Boot equivalent
// will do, so callers (menuPage.js, cartPage.js, inventoryPage.js) never
// need to change when this swaps from localStorage to fetch():
//   getAllProducts()        -> GET    /api/v1/products
//   getProductById(id)      -> GET    /api/v1/products/{id}
//   createProduct(data)     -> POST   /api/v1/admin/products
//   updateProduct(id, data) -> PUT    /api/v1/admin/products/{id}
//   deleteProduct(id)       -> DELETE /api/v1/admin/products/{id}
//   setStock(id, qty)       -> PATCH  /api/v1/admin/products/{id}/stock
//   decrementStock(id, qty) -> happens server-side inside OrderService
//                               when an order is placed; exposed here only
//                               because there is no backend yet.
//
// Both the student menu and the admin inventory page import from this one
// module, so a stock change made on either side is immediately visible on
// the other (same localStorage key, read fresh on every call — no stale
// in-memory cache to go out of sync).

import { SEED_PRODUCTS } from "../student/productData.js";

const INVENTORY_KEY = "skipq_inventory";
const LOW_STOCK_THRESHOLD = 10;

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {number} price
 * @property {number} stock
 * @property {string} image        - placeholder identifier, not a real URL in MVP
 * @property {"ACTIVE"|"INACTIVE"} status
 */

/* ==========================================================
   Seed / Load
========================================================== */

function seedIfEmpty() {
  if (localStorage.getItem(INVENTORY_KEY)) return;

  const seeded = SEED_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    stock: p.stock,
    image: p.image ?? "placeholder",
    status: p.stock > 0 ? "ACTIVE" : "ACTIVE", // status is independent of stock level (see note on getStatusLabel)
  }));

  localStorage.setItem(INVENTORY_KEY, JSON.stringify(seeded));
}

function readAll() {
  seedIfEmpty();
  return JSON.parse(localStorage.getItem(INVENTORY_KEY));
}

function writeAll(products) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(products));
}

function nextId(products) {
  return products.length === 0 ? 1 : Math.max(...products.map((p) => p.id)) + 1;
}

/* ==========================================================
   Reads
========================================================== */

/** @returns {Product[]} */
export function getAllProducts() {
  return readAll();
}

/** @param {number} id @returns {Product|undefined} */
export function getProductById(id) {
  return readAll().find((p) => p.id === id);
}

/** @returns {Product[]} products with stock < LOW_STOCK_THRESHOLD and > 0 */
export function getLowStockProducts() {
  return readAll().filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD);
}

/** @returns {Product[]} products with stock === 0 */
export function getOutOfStockProducts() {
  return readAll().filter((p) => p.stock === 0);
}

/** @returns {{ totalProducts: number, totalStock: number, outOfStockCount: number, lowStockCount: number }} */
export function getInventoryStats() {
  const products = readAll();
  return {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    outOfStockCount: products.filter((p) => p.stock === 0).length,
    lowStockCount: products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length,
  };
}

export { LOW_STOCK_THRESHOLD };

/* ==========================================================
   Admin mutations — create / edit / delete / set stock
========================================================== */

/**
 * @param {{ name: string, category: string, description?: string, price: number, stock: number, image?: string }} data
 * @returns {Product} the created product
 */
export function createProduct(data) {
  const products = readAll();
  const product = {
    id: nextId(products),
    name: data.name,
    category: data.category,
    description: data.description ?? "",
    price: Number(data.price),
    stock: Number(data.stock) || 0,
    image: data.image || "placeholder",
    status: "ACTIVE",
  };
  products.push(product);
  writeAll(products);
  return product;
}

/**
 * @param {number} id
 * @param {Partial<Product>} updates
 * @returns {Product|null}
 */
export function updateProduct(id, updates) {
  const products = readAll();
  const product = products.find((p) => p.id === id);
  if (!product) return null;

  Object.assign(product, {
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : product.price,
    stock: updates.stock !== undefined ? Number(updates.stock) : product.stock,
  });

  writeAll(products);
  return product;
}

/** @param {number} id @returns {boolean} true if a product was removed */
export function deleteProduct(id) {
  const products = readAll();
  const next = products.filter((p) => p.id !== id);
  const removed = next.length !== products.length;
  if (removed) writeAll(next);
  return removed;
}

/**
 * Sets stock to an absolute value (admin "Update stock" action).
 * @param {number} id
 * @param {number} quantity
 * @returns {Product|null}
 */
export function setStock(id, quantity) {
  return updateProduct(id, { stock: Math.max(0, Number(quantity) || 0) });
}

/**
 * Toggles a product's active/inactive status (hides it from the student
 * menu without deleting it). Independent of stock level — an ACTIVE
 * product can still be out of stock and show "Out of Stock" on the menu.
 * @param {number} id
 * @param {"ACTIVE"|"INACTIVE"} status
 */
export function setProductStatus(id, status) {
  return updateProduct(id, { status });
}

/* ==========================================================
   Order-driven mutation — the critical sync point
========================================================== */

/**
 * Decrements stock for a single product after a successful order line.
 * Called once per stationery cart item at checkout (see cartPage.js).
 * Stock is clamped at 0 — never goes negative even if two tabs race
 * (acceptable for a frontend-only MVP; a real backend would use a
 * DB-level constraint / transaction to prevent overselling).
 *
 * @param {number} productId
 * @param {number} quantity
 * @returns {Product|null} the updated product, or null if not found
 */
export function decrementStock(productId, quantity) {
  const products = readAll();
  const product = products.find((p) => p.id === productId);
  if (!product) return null;

  product.stock = Math.max(0, product.stock - quantity);
  writeAll(products);
  return product;
}

/**
 * Convenience batch version: decrements stock for every stationery
 * item in a cart at once. Print jobs (itemType: "print") are skipped
 * since they don't consume catalog stock.
 * @param {Array<{ itemType: string, productId?: number, quantity?: number }>} cartItems
 */
export function decrementStockForOrder(cartItems) {
  cartItems
    .filter((item) => item.itemType === "stationery")
    .forEach((item) => decrementStock(item.productId, item.quantity));
}