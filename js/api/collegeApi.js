
const BASE_URL = "http://localhost:8080/api/colleges";

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (_networkError) {
    throw new Error("Unable to reach the server. Check your connection.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function getCollegeByCode(code) {
  return request(`${BASE_URL}/code/${encodeURIComponent(code)}`);
}
