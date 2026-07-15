// js/student/menuApi.js

import { getSession, getToken } from "../shared/auth.js";

const BASE_URL = "http://localhost:8080/api/products";

export async function getMenuProducts() {

  const student = getSession();

  if (!student?.collegeCode) {
    throw new Error("Student college not found.");
  }

  const response = await fetch(
    `${BASE_URL}/college/${student.collegeCode}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`
    );
  }

  return response.json();
}

export async function getProductById(id) {

  const student = getSession();

  const response = await fetch(
    `${BASE_URL}/student/${id}?collegeCode=${student.collegeCode}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load product");
  }

  return response.json();
}