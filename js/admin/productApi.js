// js/admin/productApi.js

const BASE_URL = "http://localhost:8080/api/products";

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`;
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