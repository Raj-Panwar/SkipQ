// js/student/historyPage.js
import { getOrderHistory } from "./cartStore.js";
import { isAuthenticated } from "../auth/tokenStorage.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { initStudentNav } from "../shared/nav.js";

const historyList       = document.getElementById("historyList");
const emptyHistoryState = document.getElementById("emptyHistoryState");

const DEV_MODE = true;
if (!DEV_MODE && !isAuthenticated()) {
  window.location.href = "./login.html";
}

initStudentNav("history");

const SAMPLE_ORDERS = [
  { orderId: 198, tokenNumber: "#041", placedAt: "2026-06-14T10:15:00", totalAmount: 130, status: "Completed", items: [{ name: "A4 Spiral Notebook", quantity: 2, price: 65 }] },
  { orderId: 191, tokenNumber: "#033", placedAt: "2026-06-11T14:40:00", totalAmount: 75, status: "Collected", items: [{ name: "Sketch Pens (Pack of 12)", quantity: 1, price: 75 }] },
  { orderId: 184, tokenNumber: "#027", placedAt: "2026-06-08T09:05:00", totalAmount: 220, status: "Collected", items: [{ name: "Ring Binder File", quantity: 2, price: 110 }] },
  { orderId: 176, tokenNumber: "#019", placedAt: "2026-06-03T16:20:00", totalAmount: 60, status: "Cancelled", items: [{ name: "Blue Gel Pen (Pack of 5)", quantity: 1, price: 60 }] },
];

render();

function render() {
  const real = getOrderHistory();
  const orders = real.length > 0 ? real : SAMPLE_ORDERS;

  if (orders.length === 0) {
    historyList.replaceChildren();
    emptyHistoryState.hidden = false;
    return;
  }

  emptyHistoryState.hidden = true;
  const sorted = [...orders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
  historyList.replaceChildren(...sorted.map(buildCard));
}

function buildCard(order) {
  const card = document.createElement("article");
  card.className = "history-card card";

  const statusClass = {
    Completed: "badge-completed",
    Collected: "badge-ready",
    Cancelled: "badge-cancelled",
  }[order.status] || "badge-completed";

  const itemSummary = order.items
    .map((i) => `${i.quantity} × ${i.name}`)
    .join(", ");

  card.innerHTML = `
    <div class="history-card-top">
      <span class="history-token">${order.tokenNumber}</span>
      <span class="badge ${statusClass}">${order.status}</span>
    </div>
    <p class="history-items">${itemSummary}</p>
    <div class="history-card-footer">
      <span class="history-date">${formatDate(order.placedAt)}</span>
      <span class="history-amount">${formatCurrency(order.totalAmount)}</span>
    </div>
  `;

  return card;
}