// js/student/resetPasswordPage.js
// Step 2+3 of password reset, on one page: verify the OTP (gate), then
// reveal the new-password form. The final submit re-validates and
// consumes the OTP atomically with the password update, server-side.

import { verifyResetOtp, resendResetOtp, resetPassword } from "../api/studentApi.js";
import { showToast } from "../shared/toast.js";

const RESEND_COOLDOWN_SECONDS = 60;

const email = sessionStorage.getItem("pendingResetEmail");
const collegeCode = sessionStorage.getItem("pendingResetCollegeCode");

if (!email || !collegeCode) {
  window.location.replace("./forgot-password.html");
}

const emailDisplay = document.getElementById("otpEmailDisplay");

// OTP section
const otpSection = document.getElementById("otpSection");
const otpForm = document.getElementById("otpForm");
const digitInputs = Array.from(document.querySelectorAll(".otp-digit"));
const otpAlert = document.getElementById("otpAlert");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const countdownEl = document.getElementById("countdownTimer");

// Password section
const passwordSection = document.getElementById("passwordSection");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("newPassword");
const confirmInput = document.getElementById("confirmPassword");
const passwordError = document.getElementById("passwordError");
const confirmError = document.getElementById("confirmPasswordError");
const passwordAlert = document.getElementById("passwordAlert");
const resetBtn = document.getElementById("resetBtn");
const togglePassword = document.getElementById("togglePassword");

if (emailDisplay) emailDisplay.textContent = email;

let verifiedOtp = null;
let cooldownTimerId = null;

setupOtpDigitInputs(digitInputs);
startResendCooldown(RESEND_COOLDOWN_SECONDS);

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideOtpAlert();

  const otp = digitInputs.map((input) => input.value).join("");
  if (otp.length !== 6) {
    showOtpAlert("Enter the full 6-digit code.");
    return;
  }

  setVerifyLoading(true);
  try {
    await verifyResetOtp({ email, collegeCode, otp });
    verifiedOtp = otp;

    otpSection.hidden = true;
    passwordSection.hidden = false;
    passwordInput?.focus();
  } catch (error) {
    showOtpAlert(error.message || "Verification failed. Please try again.");
    clearOtpInputs();
  } finally {
    setVerifyLoading(false);
  }
});

resendBtn?.addEventListener("click", async () => {
  if (resendBtn.disabled) return;
  hideOtpAlert();
  resendBtn.disabled = true;

  try {
    await resendResetOtp({ email, collegeCode });
    showToast("A new OTP has been sent.", "success", 2000);
    clearOtpInputs();
    startResendCooldown(RESEND_COOLDOWN_SECONDS);
  } catch (error) {
    showOtpAlert(error.message || "Couldn't resend the OTP. Please try again.");
    resendBtn.disabled = false;
  }
});

togglePassword?.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";
  passwordInput.type = hidden ? "text" : "password";
  togglePassword.textContent = hidden ? "Hide" : "Show";
});

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hidePasswordAlert();
  passwordError.hidden = true;
  confirmError.hidden = true;

  const newPassword = passwordInput.value;
  const confirm = confirmInput.value;
  let valid = true;

  if (newPassword.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    passwordError.hidden = false;
    valid = false;
  }
  if (newPassword !== confirm) {
    confirmError.textContent = "Passwords do not match.";
    confirmError.hidden = false;
    valid = false;
  }
  if (!valid) return;

  setResetLoading(true);
  try {
    await resetPassword({ email, collegeCode, otp: verifiedOtp, newPassword });

    sessionStorage.removeItem("pendingResetEmail");
    sessionStorage.removeItem("pendingResetCollegeCode");

    showToast("Password updated! Redirecting to login...", "success", 2000);
    setTimeout(() => {
      window.location.replace("./login.html");
    }, 1200);
  } catch (error) {
    // If the OTP expired/was reused between verify and submit, send the
    // student back to the OTP step instead of dead-ending on this form.
    passwordSection.hidden = true;
    otpSection.hidden = false;
    clearOtpInputs();
    showOtpAlert(error.message || "That code is no longer valid. Please try again.");
    setResetLoading(false);
  }
});

function setupOtpDigitInputs(inputs) {
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      const pasted = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, inputs.length);
      if (!pasted) return;
      e.preventDefault();
      pasted.split("").forEach((digit, i) => {
        if (inputs[i]) inputs[i].value = digit;
      });
      const nextEmpty = inputs.find((el) => !el.value);
      (nextEmpty || inputs[inputs.length - 1]).focus();
    });
  });

  inputs[0]?.focus();
}

function clearOtpInputs() {
  digitInputs.forEach((input) => (input.value = ""));
  digitInputs[0]?.focus();
}

function startResendCooldown(seconds) {
  if (cooldownTimerId) clearInterval(cooldownTimerId);

  let remaining = seconds;
  resendBtn.disabled = true;
  updateCountdownLabel(remaining);

  cooldownTimerId = setInterval(() => {
    remaining -= 1;
    updateCountdownLabel(remaining);

    if (remaining <= 0) {
      clearInterval(cooldownTimerId);
      resendBtn.disabled = false;
      countdownEl.textContent = "";
    }
  }, 1000);
}

function updateCountdownLabel(remaining) {
  if (!countdownEl) return;
  countdownEl.textContent = remaining > 0 ? `Resend OTP in ${remaining}s` : "";
}

function setVerifyLoading(on) {
  verifyBtn.disabled = on;
  verifyBtn.classList.toggle("is-loading", on);
}

function setResetLoading(on) {
  resetBtn.disabled = on;
  resetBtn.classList.toggle("is-loading", on);
}

function showOtpAlert(message) {
  otpAlert.textContent = message;
  otpAlert.hidden = false;
}

function hideOtpAlert() {
  otpAlert.hidden = true;
}

function hidePasswordAlert() {
  passwordAlert.hidden = true;
}