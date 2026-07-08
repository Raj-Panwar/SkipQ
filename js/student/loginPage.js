
// js/student/loginPage.js
// Page controller for student/login.html.
// Reads the selected college from sessionStorage, loads that college's public
// queue snapshot, validates the form, logs in, and redirects to the menu.

import { loginStudent } from "../api/studentApi.js";
import { setSession, isLoggedIn } from "../shared/auth.js";
import { isValidEmail, isValidPassword } from "../utils/validators.js";
import { getPreLoginQueue } from "./orderApi.js";

const SELECTED_COLLEGE_CODE_KEY = "selectedCollegeCode";
const SELECTED_COLLEGE_NAME_KEY = "selectedCollegeName";

const selectedCollegeCode = sessionStorage.getItem(SELECTED_COLLEGE_CODE_KEY);
const selectedCollegeName = sessionStorage.getItem(SELECTED_COLLEGE_NAME_KEY);

if (!selectedCollegeCode) {
  window.location.href = "./select-college.html";
}

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const togglePasswordBtn = document.getElementById("togglePassword");
const selectedCollegeNameEl = document.getElementById("selectedCollegeName");
const changeCollegeBtn = document.getElementById("changeCollegeBtn");

if (isLoggedIn()) {
  window.location.href = "./menu.html";
}

selectedCollegeNameEl.textContent = selectedCollegeName || selectedCollegeCode;

changeCollegeBtn.addEventListener("click", () => {
    sessionStorage.removeItem("selectedCollegeCode");
    sessionStorage.removeItem("selectedCollegeName");
    window.location.replace("./select-college.html");
});

loadCurrentServing();

const queueTimer = setInterval(loadCurrentServing, 5000);

window.addEventListener("beforeunload", () => {
    clearInterval(queueTimer);
});

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

  if (!validateForm(email, password)) return;

  setLoading(true);

  try {
    const student = await loginStudent({
      collegeCode: selectedCollegeCode,
      email,
      password
    });

    setSession(student);
    window.location.href = "./menu.html";
  } catch (error) {
    showAlert(error.message || "Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
});

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

async function loadCurrentServing() {
  if (!selectedCollegeCode) return;

  try {
    const queue = await getPreLoginQueue(selectedCollegeCode);
    const token = queue.currentServingToken;

    if (token === null || token === undefined) {
      document.getElementById("tokenNumber").textContent = "---";
      document.getElementById("tokenStatus").innerHTML = `
        <span class="status-dot" aria-hidden="true"></span>
        No active orders right now
      `;
      renderQueueTimeline(document.getElementById("tokenTimeline"), []);
      return;
    }

    const padded = String(token).padStart(3, "0");

    document.getElementById("tokenNumber").textContent = `#${padded}`;
    document.getElementById("tokenStatus").innerHTML = `
      <span class="status-dot" aria-hidden="true"></span>
      Token #${padded} is being prepared
    `;

    renderQueueTimeline(
      document.getElementById("tokenTimeline"),
      queue.queueTokens || []
    );
  } catch (err) {
    console.error(err);
  }
}

function renderQueueTimeline(timeline, tokens) {
  if (!tokens.length) {
    const span = document.createElement("span");
    span.className = "timeline-chip is-current";
    span.textContent = "No queue";
    timeline.replaceChildren(span);
    return;
  }

  const chips = tokens.slice(0, 8).map((value, index) => {
    const span = document.createElement("span");
    span.className = "timeline-chip";

    if (index === 0) {
      span.classList.add("is-current");
      span.id = "currentChip";
    } else {
      span.classList.add("is-next");
    }

    span.textContent = String(value).padStart(3, "0");
    return span;
  });

  timeline.replaceChildren(...chips);

  const currentChip = timeline.querySelector(".is-current");
  if (currentChip) {
    currentChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}