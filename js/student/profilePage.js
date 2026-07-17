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

const statTotalOrders   = document.getElementById("profileStatTotalOrders");
const statTotalSpent    = document.getElementById("profileStatTotalSpent");
const statItemsOrdered  = document.getElementById("profileStatItemsOrdered");

// Mirrors the status vocabulary/labels used on the token tracking page,
// so a given order status always reads the same way across the app.
const STATUS_STEPS = ["PLACED", "PREPARING", "READY", "COMPLETED"];
const STATUS_META = {
  PLACED:    { label: "Order Received",   badgeClass: "badge-placed" },
  PREPARING: { label: "Preparing",        badgeClass: "badge-preparing" },
  READY:     { label: "Ready For Pickup", badgeClass: "badge-ready" },
  COMPLETED: { label: "Collected",        badgeClass: "badge-completed" },
  CANCELLED: { label: "Cancelled",        badgeClass: "badge-cancelled" },
};
const STEP_LABELS = ["Received", "Preparing", "Ready", "Collected"];

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status, badgeClass: "badge-completed" };
}

function buildStepperHTML(status) {
  if (status === "CANCELLED") {
    return `<p class="order-step-cancelled">This order was cancelled.</p>`;
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return `
    <div class="order-stepper" role="list" aria-label="Order status">
      ${STATUS_STEPS.map((step, i) => {
        const state = i < currentIndex ? "is-done" : i === currentIndex ? "is-current" : "";
        return `
          <div class="order-step ${state}" role="listitem">
            <span class="order-step-dot" aria-hidden="true"></span>
            <span class="order-step-label">${STEP_LABELS[i]}</span>
          </div>`;
      }).join("")}
    </div>`;
}

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
    const profile = await getStudentProfile();
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

const SKELETON_HISTORY_COUNT = 3;
const defaultEmptyHistoryHTML = emptyHistoryState.innerHTML;

async function loadHistory() {
  setHistoryLoading(true);

  try {
    const orders = await getStudentOrders();

    if (!orders || orders.length === 0) {
      historyList.replaceChildren();
      emptyHistoryState.innerHTML = defaultEmptyHistoryHTML;
      emptyHistoryState.hidden = false;
      renderStats([]);
      return;
    }

    emptyHistoryState.hidden = true;
    historyList.replaceChildren(...orders.map(buildHistoryCard));
    renderStats(orders);
  } catch (error) {
    console.error(error);
    historyList.replaceChildren();
    emptyHistoryState.innerHTML = `
      <p class="empty-state-icon" aria-hidden="true">⚠️</p>
      <h3>Couldn't load your orders</h3>
      <p>Please check your connection and try again.</p>`;
    emptyHistoryState.hidden = false;
  }
}

function renderStats(orders) {
  if (!statTotalOrders || !statTotalSpent || !statItemsOrdered) return;

  const completedOrders = orders.filter((o) => o.status !== "CANCELLED");

  const totalSpent = completedOrders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0
  );

  const itemsOrdered = completedOrders.reduce(
    (sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + (Number(i.quantity) || 0), 0),
    0
  );

  statTotalOrders.textContent = String(orders.length);
  statTotalSpent.textContent = formatCurrency(totalSpent);
  statItemsOrdered.textContent = String(itemsOrdered);
}

function setHistoryLoading(loading) {
  if (!loading) return;
  emptyHistoryState.hidden = true;
  historyList.replaceChildren(
    ...Array.from({ length: SKELETON_HISTORY_COUNT }, buildSkeletonHistoryCard)
  );
}

function buildSkeletonHistoryCard() {
  const card = document.createElement("article");
  card.className = "history-card card is-skeleton";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = `
    <div class="skeleton-history-line">
      <div class="skeleton-text" style="width:70px;height:16px;"></div>
      <div class="skeleton-text" style="width:80px;height:20px;border-radius:999px;"></div>
    </div>
    <div class="skeleton-text" style="width:60%;"></div>
    <div class="skeleton-history-line" style="padding-top:8px;border-top:1px solid var(--color-border);">
      <div class="skeleton-text" style="width:90px;"></div>
      <div class="skeleton-text" style="width:60px;"></div>
    </div>`;
  return card;
}

function buildHistoryCard(order) {
  const card = document.createElement("article");
  card.className = "history-card card";

  const statusMeta = getStatusMeta(order.status);

  const itemSummary = order.items
    .map((i) => i.quantity + " \u00D7 " + i.productName)
    .join(", ");

  card.innerHTML =
    '<div class="history-card-top">' +
      '<span class="history-token">' + order.tokenNumber + '</span>' +
      '<span class="badge ' + statusMeta.badgeClass + '">' + statusMeta.label + '</span>' +
    '</div>' +
    '<p class="history-items">' + itemSummary + '</p>' +
    buildStepperHTML(order.status) +
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
    const updated = await updateStudentProfile({ fullName, phoneNumber });

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