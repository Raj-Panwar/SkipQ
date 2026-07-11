// js/student/profilePage.js
// Controller for the Profile page: loads + edits personal info, shows
// order history (moved here from the old standalone History tab), and
// handles logout with a confirmation dialog.

import { getStudentProfile, updateStudentProfile } from "../api/studentApi.js";
import { getStudentOrders } from "./orderApi.js";
import { getSession, setSession, requireAuth, logout } from "../shared/auth.js";
import { getCachedProfile, setCachedProfile } from "./userStore.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { showToast } from "../shared/toast.js";
import { initStudentNav } from "../shared/nav.js";

requireAuth();

const profileFullName     = document.getElementById("profileFullName");
const profileCollegeLine  = document.getElementById("profileCollegeLine");

const form              = document.getElementById("profileForm");
const nameInput         = document.getElementById("profileName");
const emailInput        = document.getElementById("profileEmail");
const phoneInput        = document.getElementById("profilePhone");
const collegeNameInput  = document.getElementById("profileCollegeName");
const collegeCodeInput  = document.getElementById("profileCollegeCode");
const memberSinceInput  = document.getElementById("profileMemberSince");
const nameError         = document.getElementById("profileNameError");
const phoneError        = document.getElementById("profilePhoneError");
const formAlert         = document.getElementById("profileFormAlert");
const saveBtn           = document.getElementById("profileSaveBtn");

const historyList       = document.getElementById("historyList");
const emptyHistoryState = document.getElementById("emptyHistoryState");

const logoutBtn          = document.getElementById("profileLogoutBtn");
const logoutModalOverlay = document.getElementById("logoutModalOverlay");
const cancelLogoutBtn    = document.getElementById("cancelLogoutBtn");
const confirmLogoutBtn   = document.getElementById("confirmLogoutBtn");

initStudentNav("profile");

const student = getSession();
if (!student) {
  window.location.href = "./login.html";
}

init();

async function init() {
  // Paint instantly from cache (if any) while the fresh request is in flight.
  const cached = getCachedProfile();
  if (cached) renderProfile(cached);

  await loadProfile();
  await loadHistory();
}

async function loadProfile() {
  try {
    const profile = await getStudentProfile(student.id);
    setCachedProfile(profile);
    renderProfile(profile);
  } catch (error) {
    console.error(error);
    showToast(error.message || "Couldn't load your profile.", "error");
  }
}

function renderProfile(profile) {
  profileFullName.textContent = profile.fullName || "";
  profileCollegeLine.textContent = profile.collegeName
    ? profile.collegeName + " \u00B7 " + profile.collegeCode
    : "\u00A0";

  nameInput.value = profile.fullName || "";
  emailInput.value = profile.email || "";
  phoneInput.value = profile.phoneNumber || "";
  collegeNameInput.value = profile.collegeName || "";
  collegeCodeInput.value = profile.collegeCode || "";
  memberSinceInput.value = profile.memberSince ? formatDate(profile.memberSince) : "\u2014";
}

async function loadHistory() {
  try {
    const orders = await getStudentOrders(student.id);

    if (!orders || orders.length === 0) {
      historyList.replaceChildren();
      emptyHistoryState.hidden = false;
      return;
    }

    emptyHistoryState.hidden = true;
    historyList.replaceChildren(...orders.map(buildHistoryCard));
  } catch (error) {
    console.error(error);
  }
}

function buildHistoryCard(order) {
  const card = document.createElement("article");
  card.className = "history-card card";

  const statusClass = {
    Completed: "badge-completed",
    Collected: "badge-ready",
    Cancelled: "badge-cancelled",
  }[order.status] || "badge-completed";

  const itemSummary = order.items
    .map((i) => i.quantity + " \u00D7 " + i.productName)
    .join(", ");

  card.innerHTML =
    '<div class="history-card-top">' +
      '<span class="history-token">' + order.tokenNumber + '</span>' +
      '<span class="badge ' + statusClass + '">' + order.status + '</span>' +
    '</div>' +
    '<p class="history-items">' + itemSummary + '</p>' +
    '<div class="history-card-footer">' +
      '<span class="history-date">' + formatDate(order.createdAt) + '</span>' +
      '<span class="history-amount">' + formatCurrency(order.totalAmount) + '</span>' +
    '</div>';

  return card;
}

// ---------- Save changes ----------

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const fullName = nameInput.value.trim();
  const phoneNumber = phoneInput.value.trim();

  let valid = true;

  if (!fullName) {
    showFieldError(nameInput, nameError, "Full name is required.");
    valid = false;
  }

  if (!phoneNumber) {
    showFieldError(phoneInput, phoneError, "Phone number is required.");
    valid = false;
  } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
    showFieldError(phoneInput, phoneError, "Enter a valid 10-digit phone number.");
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  try {
    const updated = await updateStudentProfile(student.id, { fullName, phoneNumber });

    setCachedProfile(updated);
    renderProfile(updated);

    // Keep the session's cached name/phone in sync so the rest of the
    // app (e.g. the Menu welcome greeting) reflects the change too.
    setSession(Object.assign({}, student, { fullName: updated.fullName, phoneNumber: updated.phoneNumber }));

    showToast("Profile updated.", "success", 1800);
  } catch (error) {
    formAlert.textContent = error.message || "Couldn't save your changes. Please try again.";
    formAlert.hidden = false;
  } finally {
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
  [nameInput, phoneInput].forEach((i) => i.classList.remove("is-invalid"));
  [nameError, phoneError, formAlert].forEach((el) => { el.hidden = true; });
}

function setLoading(on) {
  saveBtn.disabled = on;
  saveBtn.classList.toggle("is-loading", on);
}

// ---------- Logout (with confirmation dialog) ----------

logoutBtn.addEventListener("click", () => {
  logoutModalOverlay.hidden = false;
});

cancelLogoutBtn.addEventListener("click", () => {
  logoutModalOverlay.hidden = true;
});

logoutModalOverlay.addEventListener("click", (e) => {
  if (e.target === logoutModalOverlay) logoutModalOverlay.hidden = true;
});

confirmLogoutBtn.addEventListener("click", () => {
  logoutModalOverlay.hidden = true;
  logout();
});