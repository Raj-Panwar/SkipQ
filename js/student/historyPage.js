// js/student/historyPage.js
import { getStudentOrders } from "./orderApi.js";
import { getSession } from "../shared/auth.js";
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


loadHistory();

async function loadHistory() {

    const student = getSession();
    
    console.log("Student:", student);

    const orders = await getStudentOrders(student.id);

    console.log("Orders:", orders);

    


    if (!student) {
        window.location.href = "./login.html";
        return;
    }

    try {

        const orders = await getStudentOrders(student.id);

        if (orders.length === 0) {
            historyList.replaceChildren();
            emptyHistoryState.hidden = false;
            return;
        }

        emptyHistoryState.hidden = true;
        historyList.replaceChildren(...orders.map(buildCard));

    } catch (e) {
        console.error(e);
    }
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
