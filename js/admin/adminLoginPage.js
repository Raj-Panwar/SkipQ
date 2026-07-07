// js/admin/adminLoginPage.js
// Admin login page controller.
// Validates credentials against a hardcoded admin account for MVP
// (no backend yet). In Phase 2, swap the credential check for a call
// to POST /auth/login and check role === "ADMIN" in the JWT response.

import { showToast } from "../shared/toast.js";
import { isValidEmail, isValidPassword } from "../utils/validators.js";
import { loginAdmin } from "./adminAuthApi.js";

const ADMIN_SESSION_KEY = "skipq_admin";

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const togglePasswordBtn = document.getElementById("togglePassword");
const collegeCodeInput =
  document.getElementById("collegeCode");

const collegeCodeError =
  document.getElementById("collegeCodeError");
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

  const collegeCode = collegeCodeInput.value.trim();

  const email = emailInput.value.trim();

  const password = passwordInput.value;

  if (!validate(collegeCode, email, password)) return;

  setLoading(true);



  try {

    const admin = await loginAdmin({

      collegeCode,

      email,

      password

    });

    sessionStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify(admin)
    );

    showToast(
      `Welcome back, ${admin.fullName}`,
      "success"
    );

    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 700);

  } catch (err) {

    showAlert(
    err.message || "Login failed. Please try again."
);

    setLoading(false);

}
});

function validate(collegeCode, email, password) {
  let valid = true;
  if (!collegeCode) {

    showFieldError(
      collegeCodeInput,
      collegeCodeError,
      "Enter college code."
    );

    valid = false;

  } else {

    clearFieldError(
      collegeCodeInput,
      collegeCodeError
    );

  }

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

