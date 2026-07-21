// js/student/forgotPasswordPage.js
// Step 1 of password reset: collect the email (college is already known
// from the onboarding selection), request an OTP, move to reset-password.html.

import { forgotPassword } from "../api/studentApi.js";
import { showToast } from "../shared/toast.js";

const SELECTED_COLLEGE_CODE_KEY = "selectedCollegeCode";
const SELECTED_COLLEGE_NAME_KEY = "selectedCollegeName";

const selectedCollegeCode = sessionStorage.getItem(SELECTED_COLLEGE_CODE_KEY);
const selectedCollegeName = sessionStorage.getItem(SELECTED_COLLEGE_NAME_KEY);

if (!selectedCollegeCode) {
  window.location.replace("./select-college.html");
}

const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const selectedCollegeNameEl = document.getElementById("selectedCollegeName");
const changeCollegeBtn = document.getElementById("changeCollegeBtn");

if (selectedCollegeNameEl) {
  selectedCollegeNameEl.textContent = selectedCollegeName || selectedCollegeCode;
}

changeCollegeBtn?.addEventListener("click", () => {
  sessionStorage.removeItem(SELECTED_COLLEGE_CODE_KEY);
  sessionStorage.removeItem(SELECTED_COLLEGE_NAME_KEY);
  window.location.replace("./select-college.html");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = emailInput.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError("Enter a valid email address.");
    return;
  }

  setLoading(true);
  try {
    const response = await forgotPassword({ email, collegeCode: selectedCollegeCode });

    sessionStorage.setItem("pendingResetEmail", email);
    sessionStorage.setItem("pendingResetCollegeCode", selectedCollegeCode);

    showToast(response.message || "If an account exists, an OTP has been sent.", "success", 2200);
    setTimeout(() => {
      window.location.replace("./reset-password.html");
    }, 900);
  } catch (error) {
    formAlert.textContent = error.message || "Something went wrong. Please try again.";
    formAlert.hidden = false;
    setLoading(false);
  }
});

function showFieldError(message) {
  emailInput.classList.add("is-invalid");
  emailError.textContent = message;
  emailError.hidden = false;
}

function clearErrors() {
  emailInput.classList.remove("is-invalid");
  emailError.hidden = true;
  formAlert.hidden = true;
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle("is-loading", on);
}