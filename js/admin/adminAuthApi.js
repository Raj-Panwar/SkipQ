const ADMINS_URL = "http://localhost:8080/api/admins";

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
  } catch {
    throw new Error("Unable to reach server.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      "Login failed."
    );
  }

  return data;
}

export function loginAdmin(credentials) {
  return request(`${ADMINS_URL}/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}