// js/student/loginPage.js
// Page controller for student/login.html.
// Validates the form, calls authApi.login, persists the session,
// redirects to the menu on success, and runs the decorative
// "now serving" token simulation in the hero card.

import { login } from "../api/authApi.js";
import { ApiError } from "../api/apiClient.js";
import { setToken, setUser, isAuthenticated } from "../auth/tokenStorage.js";
import { isValidEmail, isValidPassword } from "../utils/validators.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const togglePasswordBtn = document.getElementById("togglePassword");

// If the student is already logged in, skip straight to the menu.
if (isAuthenticated()) {
  window.location.href = "./menu.html";
}

initQueueSimulation();

togglePasswordBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
  togglePasswordBtn.setAttribute("aria-pressed", String(isHidden));
  togglePasswordBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAlert();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const isValid = validateForm(email, password);
  if (!isValid) return;

  setLoading(true);

  try {
    console.log("Login button clicked");
    const response = await login({ email, password });
    console.log("Login response:", response);
    setToken(response.token);
    setUser(response.user);
    console.log("Redirecting to menu...");
    window.location.href = "./menu.html";
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      showAlert("Incorrect email or password. Please try again.");
    } else if (error instanceof ApiError && error.status === 0) {
      showAlert("Unable to reach the server. Check your connection and try again.");
    } else {
      showAlert(error.message || "Login failed. Please try again.");
    }
  } finally {
    setLoading(false);
  }
});

/**
 * @param {string} email
 * @param {string} password
 * @returns {boolean} true if both fields pass validation
 */
function validateForm(email, password) {
  let valid = true;

  if (!isValidEmail(email)) {
    showFieldError(emailInput, emailError, "Enter a valid email address.");
    valid = false;
  } else {
    clearFieldError(emailInput, emailError);
  }

  if (!isValidPassword(password)) {
    showFieldError(passwordInput, passwordError, "Password must be at least 6 characters.");
    valid = false;
  } else {
    clearFieldError(passwordInput, passwordError);
  }

  return valid;
}

function showFieldError(input, errorEl, message) {
  input.classList.add("is-invalid");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearFieldError(input, errorEl) {
  input.classList.remove("is-invalid");
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function showAlert(message) {
  formAlert.textContent = message;
  formAlert.hidden = false;
}

function hideAlert() {
  formAlert.hidden = true;
  formAlert.textContent = "";
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

/**
 * Decorative "live queue" simulation in the hero token card.
 * Every few seconds the progress bar fills, the current token advances,
 * and the horizontal timeline shifts — purely illustrative, no API call.
 * Respects prefers-reduced-motion (shows a static snapshot).
 */
function initQueueSimulation() {
  const tokenNumberEl = document.getElementById("tokenNumber");
  const progressFill = document.getElementById("progressFill");
  const statusEl = document.getElementById("tokenStatus");
  const timeline = document.getElementById("tokenTimeline");

  if (!tokenNumberEl || !progressFill || !timeline) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  let current = 46;

  setInterval(() => {
    progressFill.style.width = "30%";

    setTimeout(() => {
      current += 1;
      const padded = String(current).padStart(3, "0");

      tokenNumberEl.textContent = `#${padded}`;
      progressFill.style.width = "64%";
      statusEl.innerHTML = `<span class="status-dot" aria-hidden="true"></span> Token #${padded} is being prepared — almost ready`;

      shiftTimeline(timeline, current);
    }, 700);
  }, 4000);
}

/**
 * Shifts the horizontal chip timeline so the new "current" token
 * is centered, with served tokens before it and upcoming after.
 * @param {HTMLElement} timeline
 * @param {number} current
 */
function shiftTimeline(timeline, current) {
  const chips = [];
  for (let offset = -4; offset <= 2; offset++) {
    const value = current + offset;
    const padded = String(value).padStart(3, "0");
    const span = document.createElement("span");
    span.className = "timeline-chip";

    if (offset === 0) {
      span.classList.add("is-current");
      span.id = "currentChip";
    } else if (offset > 0) {
      span.classList.add("is-next");
    } else {
      span.setAttribute("data-served", "");
    }

    span.textContent = padded;
    chips.push(span);
  }

  timeline.replaceChildren(...chips);

  const currentChip = timeline.querySelector(".is-current");
  if (currentChip) {
    currentChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}