// js/student/tokenPage.js

import { formatCurrency } from "../utils/formatters.js";
import { initStudentNav } from "../shared/nav.js";

import {
  getActiveOrder,
  getQueueInfo,
  cancelOrder
} from "./orderApi.js";
import { getSession, requireAuth } from "../shared/auth.js";

requireAuth();

const myTokenNumberEl = document.getElementById("myTokenNumber");
const statusBadge = document.getElementById("statusBadge");
const nowServingNumberEl = document.getElementById("nowServingNumber");
const progressFill = document.getElementById("progressFill");
const waitEstimateEl = document.getElementById("waitEstimate");
const queuePositionEl = document.getElementById("queuePosition");
const tokenTimeline = document.getElementById("tokenTimeline");
const liveRefreshDot = document.getElementById("liveRefreshDot");
const orderSummaryItems = document.getElementById("orderSummaryItems");
const orderTotalEl = document.getElementById("orderTotal");
const cancelOrderBtn = document.getElementById("cancelOrderBtn");
const servingRow = document.getElementById("servingRow");
const cancelledMessage = document.getElementById("cancelledMessage");
const progressSection = document.getElementById("progressSection");
const waitEstimateRow = document.getElementById("waitEstimateRow");
const queueTimelineSection = document.getElementById("queueTimelineSection");


initStudentNav("token");
const tokenHeroCard = document.querySelector(".token-hero-card");
let order;
let myTokenValue = 0;
let nowServingValue = 0;

initializeTokenPage();



function parseTokenNumber(token) {
  return Number(String(token).replace("#", ""));
}

function formatToken(value) {
  return `#${String(value).padStart(3, "0")}`;
}


async function initializeTokenPage() {
  tokenHeroCard?.classList.add("is-loading");

  try {

    order = await getActiveOrder();

    myTokenValue = order.tokenNumber;
    nowServingValue = myTokenValue;

    renderOrderSummary(order);

    await loadQueue();

    tokenHeroCard?.classList.remove("is-loading");
    myTokenNumberEl?.classList.add("token-reveal");

    window.queueRefreshInterval = setInterval(loadQueue, 5000);

  } catch (err) {

    alert("You don't have any active orders.");

    window.location.href = "./history.html";
  }
}

function renderOrderSummary(order) {
  myTokenNumberEl.textContent = formatToken(myTokenValue);

  orderSummaryItems.replaceChildren(
    ...order.items.map((item) => {
      const li = document.createElement("li");
      li.className = "order-summary-item";
      li.innerHTML = `
        <span>${item.quantity} × ${item.productName}</span>
        <span>${formatCurrency(item.price * item.quantity)}</span>
      `;
      return li;
    })
  );

  orderTotalEl.textContent = formatCurrency(order.totalAmount);
}

function renderQueueState(queue) {

  nowServingNumberEl.textContent = formatToken(queue.currentServing);

  queuePositionEl.textContent = queue.peopleAhead;

  if (queue.estimatedWait == null) {
    waitEstimateEl.textContent = "Calculating...";
  } else if (queue.peopleAhead === 0) {
    waitEstimateEl.textContent = "No waiting";
  } else {
    waitEstimateEl.textContent = `${queue.estimatedWait} min`;
  }

  const progressPercent =
    queue.peopleAhead === 0
      ? 100
      : Math.min(
        95,
        Math.round(
          (1 - queue.peopleAhead / (queue.peopleAhead + 4)) * 100
        )
      );

  progressFill.style.width = progressPercent + "%";

  updateStatusBadge(queue.status);

  rebuildTimeline(queue.peopleAhead);
}
async function loadQueue() {
  try {

    const queue = await getQueueInfo(order.id);

    myTokenValue = queue.tokenNumber;
    nowServingValue = queue.currentServing;

    renderQueueState(queue);
    pulseRefreshDot();
    if (queue.status === "CANCELLED") {
      clearInterval(queueRefreshInterval);
    }

  } catch (err) {
    console.error(err);
  }
}

function pulseRefreshDot() {
  if (!liveRefreshDot) return;
  liveRefreshDot.classList.remove("is-pulsing");
  // Force reflow so the animation can restart on consecutive polls.
  void liveRefreshDot.offsetWidth;
  liveRefreshDot.classList.add("is-pulsing");
}

cancelOrderBtn.addEventListener("click", handleCancelOrder);
function updateStatusBadge(status) {
  cancelOrderBtn.hidden = status !== "PLACED";
  const isCancelled = status === "CANCELLED";
  cancelledMessage.hidden = !isCancelled;

  servingRow.hidden = isCancelled;
  progressSection.hidden = isCancelled;
  waitEstimateRow.hidden = isCancelled;
  queueTimelineSection.hidden = isCancelled;

  statusBadge.classList.remove(
    "badge-placed",
    "badge-preparing",
    "badge-ready",
    "badge-completed",
    "badge-cancelled"
  );

  switch (status) {

    case "PLACED":
      statusBadge.textContent = "Order Received";
      statusBadge.classList.add("badge-placed");
      break;

    case "PREPARING":
      statusBadge.textContent = "Preparing";
      statusBadge.classList.add("badge-preparing");
      break;

    case "READY":
      statusBadge.textContent = "Ready For Pickup";
      statusBadge.classList.add("badge-ready");
      break;

    case "CANCELLED":
      statusBadge.textContent = "Cancelled";
      statusBadge.classList.add("badge-cancelled");
      break;

    case "COMPLETED":
      statusBadge.textContent = "Collected";
      statusBadge.classList.add("badge-completed");
      break;

    default:
      statusBadge.textContent = order.status;
  }
}

function rebuildTimeline(queuePosition) {
  const chips = [];
  for (let offset = -4; offset <= Math.max(2, queuePosition + 1); offset++) {
    const value = nowServingValue + offset;
    if (value < 1) continue;

    const span = document.createElement("span");
    span.className = "timeline-chip";
    span.textContent = String(value).padStart(3, "0");

    if (value === nowServingValue) {
      span.classList.add("is-current");
    } else if (value === myTokenValue) {
      span.classList.add("is-next", "is-mine");
    } else if (value < nowServingValue) {
      span.setAttribute("data-served", "");
    } else {
      span.classList.add("is-next");
    }

    chips.push(span);
  }

  tokenTimeline.replaceChildren(...chips);
  tokenTimeline.querySelector(".is-current")?.scrollIntoView({
    behavior: "smooth", inline: "center", block: "nearest"
  });
}
async function handleCancelOrder() {

  const confirmed = confirm(
    "Are you sure you want to cancel this order?"
  );

  if (!confirmed) {
    return;
  }

  try {
    cancelOrderBtn.disabled = true;
    cancelOrderBtn.textContent = "Cancelling...";

    await cancelOrder(order.id);

    await loadQueue();

  } catch (err) {

    cancelOrderBtn.disabled = false;
    cancelOrderBtn.textContent = "Cancel Order";

    alert(err.message);
  }
}