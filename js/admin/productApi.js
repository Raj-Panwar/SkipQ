// js/admin/productApi.js

const BASE_URL = "http://localhost:8080/api/products";
const ADMIN_PRODUCTS_BASE_URL = "http://localhost:8080/api/admin/products";

async function request(url, options = {}) {

  const admin = JSON.parse(
    sessionStorage.getItem("skipq_admin")
  );

  const isFormData = options.body instanceof FormData;

  let response;

  try {

    response = await fetch(url, {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(admin?.token ? { Authorization: `Bearer ${admin.token}` } : {})
      },
      ...options,
    });

  } catch (_networkError) {

    throw new Error(
      "Unable to reach the server. Check your connection."
    );

  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {

    const message =
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`;

    throw new Error(message);

  }

  return data;
}

export function getProducts() {
  return request(BASE_URL);
}

export function getProduct(id) {
  return request(`${BASE_URL}/${id}`);
}

export function createProduct(product) {
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, product) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export function deleteProduct(id) {
  return request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}

export function getLowStockProducts() {
  return request(`${BASE_URL}/low-stock`);
}

/**
 * Uploads (or replaces) a product's image. Returns the full updated
 * Product (including the new imagePath) so callers can refresh the UI
 * immediately without a second request.
 */
export function uploadProductImage(id, file) {
  const formData = new FormData();
  formData.append("file", file);

  return request(`${ADMIN_PRODUCTS_BASE_URL}/${id}/image`, {
    method: "POST",
    body: formData,
  });
}