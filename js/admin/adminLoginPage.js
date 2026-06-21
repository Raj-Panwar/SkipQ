// js/admin/adminLoginPage.js
// Admin login page controller.
// Validates credentials against a hardcoded admin account for MVP
// (no backend yet). In Phase 2, swap the credential check for a call
// to POST /auth/login and check role === "ADMIN" in the JWT response.

import { showToast } from "../shared/toast.js";
import { isValidEmail, isValidPassword } from "../utils/validators.js";

const ADMIN_EMAIL = "admin@skipq.in";
const ADMIN_PASSWORD = "admin123";
const ADMIN_SESSION_KEY = "skipq_admin_session";

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const togglePasswordBtn = document.getElementById("togglePassword");

// Already logged in as admin — skip to dashboard.
if (sessionStorage.getItem(ADMIN_SESSION_KEY)) {
  window.location.href = "./dashboard.html";
}

togglePasswordBtn.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";
  passwordInput.type = hidden ? "text" : "password";
  togglePasswordBtn.textContent = hidden ? "Hide" : "Show";
  togglePasswordBtn.setAttribute("aria-pressed", String(hidden));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAlert();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!validate(email, password)) return;

  setLoading(true);

  // Simulate async credential check (replace with API call in Phase 2)
  await delay(500);

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({ email, role: "ADMIN", loginAt: new Date().toISOString() })
    );
    showToast("Welcome back, Admin", "success");
    setTimeout(() => { window.location.href = "./dashboard.html"; }, 700);
  } else {
    showAlert("Incorrect email or password.");
    setLoading(false);
  }
});

function validate(email, password) {
  let valid = true;

  if (!isValidEmail(email)) {
    showFieldError(emailInput, emailError, "Enter a valid email address.");
    valid = false;
  } else clearFieldError(emailInput, emailError);

  if (!isValidPassword(password)) {
    showFieldError(passwordInput, passwordError, "Password must be at least 6 characters.");
    valid = false;
  } else clearFieldError(passwordInput, passwordError);

  return valid;
}

function showFieldError(input, el, msg) {
  input.classList.add("is-invalid");
  el.textContent = msg;
  el.hidden = false;
}

function clearFieldError(input, el) {
  input.classList.remove("is-invalid");
  el.hidden = true;
}

function showAlert(msg) {
  formAlert.textContent = msg;
  formAlert.hidden = false;
}

function hideAlert() {
  formAlert.hidden = true;
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle("is-loading", on);
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}