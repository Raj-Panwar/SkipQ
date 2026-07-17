// js/student/historyPage.js
import { getStudentOrders } from "./orderApi.js";
import { getSession, requireAuth } from "../shared/auth.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { initStudentNav } from "../shared/nav.js";

const historyList       = document.getElementById("historyList");
const emptyHistoryState = document.getElementById("emptyHistoryState");

requireAuth();

initStudentNav("history");

const SKELETON_HISTORY_COUNT = 4;
const defaultEmptyHistoryHTML = emptyHistoryState.innerHTML;

loadHistory();

async function loadHistory() {
    

    setHistoryLoading(true);

    try {
        const orders = await getStudentOrders();

        if (orders.length === 0) {
            historyList.replaceChildren();
            emptyHistoryState.innerHTML = defaultEmptyHistoryHTML;
            emptyHistoryState.hidden = false;
            return;
        }

        emptyHistoryState.hidden = true;
        historyList.replaceChildren(...orders.map(buildCard));

    } catch (e) {
        console.error(e);
        historyList.replaceChildren();
        emptyHistoryState.innerHTML = `
          <p class="empty-state-icon" aria-hidden="true">⚠️</p>
          <h2>Couldn't load your history</h2>
          <p>Please check your connection and try again.</p>`;
        emptyHistoryState.hidden = false;
    }
}

function setHistoryLoading(loading) {
    if (!loading) return;
    emptyHistoryState.hidden = true;
    historyList.replaceChildren(
        ...Array.from({ length: SKELETON_HISTORY_COUNT }, buildSkeletonCard)
    );
}

function buildSkeletonCard() {
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



function buildCard(order) {
  const card = document.createElement("article");
  card.className = "history-card card";

  const statusClass = {
    Completed: "badge-completed",
    Collected: "badge-ready",
    Cancelled: "badge-cancelled",
  }[order.status] || "badge-completed";

  const itemSummary = order.items
    .map((i) => `${i.quantity} × ${i.productName}`)
    .join(", ");

  card.innerHTML = `
    <div class="history-card-top">
      <span class="history-token">${order.tokenNumber}</span>
      <span class="badge ${statusClass}">${order.status}</span>
    </div>
    <p class="history-items">${itemSummary}</p>
    <div class="history-card-footer">
      <span class="history-date">${formatDate(order.createdAt)}</span>
      <span class="history-amount">${formatCurrency(order.totalAmount)}</span>
    </div>
  `;

  return card;
}