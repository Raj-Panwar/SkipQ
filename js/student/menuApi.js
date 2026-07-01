// js/student/menuApi.js

const BASE_URL = "http://localhost:8080/api/products";

export async function getMenuProducts() {
  const response = await fetch(BASE_URL, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}
export async function getProductById(id) {
    const response = await fetch(`http://localhost:8080/api/products/${id}`);

    if (!response.ok) {
        throw new Error("Failed to load product");
    }

    return response.json();
}