// js/student/registerPage.js
// MERGED: replaced the previous fake/no-op registration with a real
// call to POST /api/students/register via studentApi.js. On success
// the page redirects to login.html. All existing UI (strength meter,
// toggles, field validation, loading state, toast) is unchanged.

import { registerStudent } from "../api/studentApi.js";
import { isAuthenticated } from "../auth/tokenStorage.js";
import { showToast } from "../shared/toast.js";

// Already logged in → skip registration
if (isAuthenticated()) {
  window.location.href = "./menu.html";
}

const form           = document.getElementById("registerForm");
const fullNameInput  = document.getElementById("fullName");
const emailInput     = document.getElementById("email");
const phoneInput     = document.getElementById("phone");
const passwordInput  = document.getElementById("password");
const confirmInput   = document.getElementById("confirmPassword");
const fullNameError  = document.getElementById("fullNameError");
const emailError     = document.getElementById("emailError");
const phoneError     = document.getElementById("phoneError");
const passwordError  = document.getElementById("passwordError");
const confirmError   = document.getElementById("confirmPasswordError");
const formAlert      = document.getElementById("formAlert");
const submitBtn      = document.getElementById("submitBtn");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirm  = document.getElementById("toggleConfirmPassword");
const strengthMeter  = document.getElementById("strengthMeter");
const strengthLabel  = document.getElementById("strengthLabel");

togglePassword?.addEventListener("click", () => toggleVis(passwordInput, togglePassword));
toggleConfirm?.addEventListener("click",  () => toggleVis(confirmInput,  toggleConfirm));

function toggleVis(input, btn) {
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  btn.textContent = hidden ? "Hide" : "Show";
  btn.setAttribute("aria-pressed", String(hidden));
}

passwordInput?.addEventListener("input", () => {
  updateStrength(passwordInput.value);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const fullName = fullNameInput.value.trim();
  const email    = emailInput.value.trim();
  const phone    = phoneInput.value.trim();
  const password = passwordInput.value;
  const confirm  = confirmInput.value;

  let valid = true;

  if (!fullName) {
    showFieldError(fullNameInput, fullNameError, "Full name is required."); valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError(emailInput, emailError, "Enter a valid email address."); valid = false;
  }
  if (!phone) {
    showFieldError(phoneInput, phoneError, "Phone number is required."); valid = false;
  }
  if (password.length < 6) {
    showFieldError(passwordInput, passwordError, "Password must be at least 6 characters."); valid = false;
  }
  if (password !== confirm) {
    showFieldError(confirmInput, confirmError, "Passwords do not match."); valid = false;
  }
  if (!valid) return;

  setLoading(true);

  try {
    // CHANGED: real backend call replacing the previous no-op/fake call
    await registerStudent({
      fullName,
      email,
      phoneNumber: phone,  // backend field name is phoneNumber
      password,
    });

    showToast("Account created! Redirecting to login…", "success", 2000);
    form.reset();
    updateStrength("");

    setTimeout(() => { window.location.href = "./login.html"; }, 1500);
  } catch (error) {
    formAlert.textContent = error.message || "Registration failed. Please try again.";
    formAlert.hidden = false;
    setLoading(false);
  }
});

function showFieldError(input, el, msg) {
  if (!input || !el) return;
  input.classList.add("is-invalid");
  el.textContent = msg;
  el.hidden = false;
}

function clearErrors() {
  [fullNameInput, emailInput, phoneInput, passwordInput, confirmInput]
    .filter(Boolean).forEach((i) => i.classList.remove("is-invalid"));
  [fullNameError, emailError, phoneError, passwordError, confirmError, formAlert]
    .filter(Boolean).forEach((el) => { el.hidden = true; });
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle("is-loading", on);
}

function updateStrength(value) {
  if (!strengthMeter || !strengthLabel) return;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10 && /[0-9]/.test(value) && /[a-zA-Z]/.test(value)) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value) && /[^a-zA-Z0-9]/.test(value)) score++;
  const labels  = ["", "Weak", "Okay", "Strong"];
  const classes = ["", "is-weak", "is-okay", "is-strong"];
  strengthMeter.querySelectorAll(".strength-bar").forEach((bar, i) => {
    bar.classList.remove("is-weak", "is-okay", "is-strong");
    if (i < score) bar.classList.add(classes[score]);
  });
  strengthLabel.textContent = labels[score];
  strengthLabel.className   = "strength-label";
  if (score > 0) strengthLabel.classList.add(classes[score].replace("is-", "text-"));
}