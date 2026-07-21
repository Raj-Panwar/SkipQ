// js/student/registerOtpPage.js
// Step 2 of registration: verify the emailed OTP, which creates the
// account. On success the student is redirected to log in — registration
// intentionally does not auto-login.

import { verifyRegisterOtp, resendRegisterOtp } from "../api/studentApi.js";
import { showToast } from "../shared/toast.js";

const RESEND_COOLDOWN_SECONDS = 60;

const email = sessionStorage.getItem("pendingRegisterEmail");
const collegeCode = sessionStorage.getItem("pendingRegisterCollegeCode");

if (!email || !collegeCode) {
  window.location.replace("./register.html");
}

const emailDisplay = document.getElementById("otpEmailDisplay");
const form = document.getElementById("otpForm");
const digitInputs = Array.from(document.querySelectorAll(".otp-digit"));
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const resendBtn = document.getElementById("resendBtn");
const countdownEl = document.getElementById("countdownTimer");
const changeEmailBtn = document.getElementById("changeEmailBtn");

if (emailDisplay) emailDisplay.textContent = email;

let cooldownTimerId = null;

setupOtpDigitInputs(digitInputs);
startResendCooldown(RESEND_COOLDOWN_SECONDS);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const otp = digitInputs.map((input) => input.value).join("");
  if (otp.length !== 6) {
    showAlert("Enter the full 6-digit code.");
    return;
  }

  setLoading(true);
  try {
    await verifyRegisterOtp({ email, collegeCode, otp });

    sessionStorage.removeItem("pendingRegisterEmail");
    sessionStorage.removeItem("pendingRegisterCollegeCode");

    showToast("Account created! Redirecting to login...", "success", 2000);
    setTimeout(() => {
      window.location.replace("./login.html");
    }, 1200);
  } catch (error) {
    showAlert(error.message || "Verification failed. Please try again.");
    clearOtpInputs();
    setLoading(false);
  }
});

resendBtn?.addEventListener("click", async () => {
  if (resendBtn.disabled) return;
  hideAlert();
  resendBtn.disabled = true;

  try {
    await resendRegisterOtp({ email, collegeCode });
    showToast("A new OTP has been sent.", "success", 2000);
    clearOtpInputs();
    startResendCooldown(RESEND_COOLDOWN_SECONDS);
  } catch (error) {
    showAlert(error.message || "Couldn't resend the OTP. Please try again.");
    resendBtn.disabled = false;
  }
});

changeEmailBtn?.addEventListener("click", () => {
  sessionStorage.removeItem("pendingRegisterEmail");
  sessionStorage.removeItem("pendingRegisterCollegeCode");
  window.location.replace("./register.html");
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

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle("is-loading", on);
}

function showAlert(message) {
  formAlert.textContent = message;
  formAlert.hidden = false;
}

function hideAlert() {
  formAlert.hidden = true;
}