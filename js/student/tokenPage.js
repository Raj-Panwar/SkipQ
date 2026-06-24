// js/student/tokenPage.js
import { isAuthenticated } from "../auth/tokenStorage.js";
import { formatCurrency } from "../utils/formatters.js";
import { initStudentNav } from "../shared/nav.js";
import { getOrderById } from "./orderApi.js";
const myTokenNumberEl   = document.getElementById("myTokenNumber");
const statusBadge       = document.getElementById("statusBadge");
const nowServingNumberEl = document.getElementById("nowServingNumber");
const progressFill      = document.getElementById("progressFill");
const waitEstimateEl    = document.getElementById("waitEstimate");
const queuePositionEl   = document.getElementById("queuePosition");
const tokenTimeline     = document.getElementById("tokenTimeline");
const orderSummaryItems = document.getElementById("orderSummaryItems");
const orderTotalEl      = document.getElementById("orderTotal");

const DEV_MODE = true;
if (!DEV_MODE && !isAuthenticated()) {
  window.location.href = "./login.html";
}

initStudentNav("token");

const order = loadOrder();
console.log(
  "Loaded Order:",
  JSON.parse(sessionStorage.getItem("skipq_latest_order"))
);
let myTokenValue    = parseTokenNumber(order.tokenNumber);
let nowServingValue = Math.max(1, myTokenValue - 6);

renderOrderSummary(order);
renderQueueState();
//startSimulation();

function loadOrder() {
  const raw = sessionStorage.getItem("skipq_latest_order");
  if (raw) return JSON.parse(raw);
  return {
    orderId: 203,
    tokenNumber: "#052",
    items: [
      { name: "A4 Spiral Notebook", quantity: 2, price: 65 },
      { name: "Blue Gel Pen (Pack of 5)", quantity: 1, price: 60 },
    ],
    totalAmount: 190,
    placedAt: new Date().toISOString(),
  };
}

function parseTokenNumber(token) {
  return Number(String(token).replace("#", ""));
}

function formatToken(value) {
  return `#${String(value).padStart(3, "0")}`;
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

function renderQueueState() {
  const queuePosition = Math.max(0, myTokenValue - nowServingValue);

  nowServingNumberEl.textContent = formatToken(nowServingValue);
  queuePositionEl.textContent = String(queuePosition);
  waitEstimateEl.textContent = `${queuePosition * 3} min`;

  const progressPercent = queuePosition === 0
    ? 100
    : Math.min(95, Math.round((1 - queuePosition / (queuePosition + 4)) * 100));
  progressFill.style.width = `${progressPercent}%`;

  updateStatusBadge(order.status);
  rebuildTimeline(queuePosition);
}
setInterval(async () => {
  try {

    const latestOrder = await getOrderById(order.id);

    order.status = latestOrder.status;

    updateStatusBadge(order.status);

  } catch (err) {
    console.error(err);
  }

}, 10000);

function updateStatusBadge(status) {

  statusBadge.classList.remove(
    "badge-placed",
    "badge-preparing",
    "badge-ready",
    "badge-completed"
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

/*function startSimulation() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const interval = setInterval(() => {
    if (nowServingValue >= myTokenValue) {
      clearInterval(interval);
      return;
    }
    nowServingValue += 1;
    renderQueueState();
  }, 3500);
}*/