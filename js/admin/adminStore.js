// js/admin/adminStore.js
// Mock data layer for the admin dashboard.
// In Phase 2 this is replaced by calls to the Spring Boot REST API
// (GET /admin/orders, PATCH /admin/orders/{id}/status, etc.)
// For MVP all state lives here in memory + localStorage for the session.

const ADMIN_ORDERS_KEY = "skipq_admin_orders";
const ADMIN_PRINT_JOBS_KEY = "skipq_admin_printjobs";

export const ORDER_STATUSES = {
  PLACED: "Placed",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PRINT_JOB_STATUSES = {
  PENDING: "Pending",
  PRINTING: "Printing",
  COMPLETED: "Completed",
};

function generateOrderId() {
  return Math.floor(Math.random() * 900) + 100;
}

function formatToken(n) {
  return `#${String(n).padStart(3, "0")}`;
}

function minsAgo(n) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

const SEED_ORDERS = [
  { orderId: 201, tokenNumber: "#052", studentName: "Riya Sharma", rollNumber: "CS2101", items: [{ name: "A4 Spiral Notebook", qty: 2 }, { name: "Blue Gel Pen (Pack of 5)", qty: 1 }], totalAmount: 190, status: ORDER_STATUSES.READY, placedAt: minsAgo(4) },
  { orderId: 200, tokenNumber: "#051", studentName: "Arjun Mehta", rollNumber: "EC1903", items: [{ name: "Highlighter Set (4 colors)", qty: 1 }], totalAmount: 90, status: ORDER_STATUSES.PREPARING, placedAt: minsAgo(9) },
  { orderId: 199, tokenNumber: "#050", studentName: "Priya Nair", rollNumber: "ME2045", items: [{ name: "Stapler (Standard)", qty: 1 }, { name: "Ring Binder File", qty: 1 }], totalAmount: 205, status: ORDER_STATUSES.PLACED, placedAt: minsAgo(12) },
  { orderId: 198, tokenNumber: "#049", studentName: "Dev Patel", rollNumber: "CS1987", items: [{ name: "Project File (L-Fold)", qty: 3 }], totalAmount: 75, status: ORDER_STATUSES.COMPLETED, placedAt: minsAgo(25) },
  { orderId: 197, tokenNumber: "#048", studentName: "Sneha Iyer", rollNumber: "IT2234", items: [{ name: "Long Notebook", qty: 2 }, { name: "Black Ballpoint Pen", qty: 5 }], totalAmount: 140, status: ORDER_STATUSES.COMPLETED, placedAt: minsAgo(38) },
];

const SEED_PRINT_JOBS = [
  { jobId: "pj-001", tokenNumber: "#052", studentName: "Riya Sharma", rollNumber: "CS2101", fileName: "CS_Assignment_Unit3.pdf", pages: 12, copies: 2, colorMode: "BW", sided: "DOUBLE", paperSize: "A4", totalPrice: 48, status: PRINT_JOB_STATUSES.PENDING, placedAt: minsAgo(4) },
  { jobId: "pj-002", tokenNumber: "#050", studentName: "Priya Nair", rollNumber: "ME2045", fileName: "Lab_Report_Final.pdf", pages: 8, copies: 1, colorMode: "COLOR", sided: "SINGLE", paperSize: "A4", totalPrice: 80, status: PRINT_JOB_STATUSES.PRINTING, placedAt: minsAgo(12) },
  { jobId: "pj-003", tokenNumber: "#049", studentName: "Dev Patel", rollNumber: "CS1987", fileName: "Internship_Certificate.pdf", pages: 1, copies: 3, colorMode: "COLOR", sided: "SINGLE", paperSize: "A4", totalPrice: 30, status: PRINT_JOB_STATUSES.COMPLETED, placedAt: minsAgo(25) },
];

/* ==========================================================
   Seed / Load
========================================================== */

function seedIfEmpty() {
  if (!localStorage.getItem(ADMIN_ORDERS_KEY)) {
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(SEED_ORDERS));
  }
  if (!localStorage.getItem(ADMIN_PRINT_JOBS_KEY)) {
    localStorage.setItem(ADMIN_PRINT_JOBS_KEY, JSON.stringify(SEED_PRINT_JOBS));
  }
}

export function getOrders() {
  seedIfEmpty();
  return JSON.parse(localStorage.getItem(ADMIN_ORDERS_KEY));
}

export function getPrintJobs() {
  seedIfEmpty();
  return JSON.parse(localStorage.getItem(ADMIN_PRINT_JOBS_KEY));
}

function saveOrders(orders) {
  localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
}

function savePrintJobs(jobs) {
  localStorage.setItem(ADMIN_PRINT_JOBS_KEY, JSON.stringify(jobs));
}

/* ==========================================================
   Order mutations
========================================================== */

export function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const order = orders.find((o) => o.orderId === orderId);
  if (!order) return false;
  order.status = newStatus;
  saveOrders(orders);
  return true;
}

export function ingestStudentOrder(order) {
  // Called when a student order arrives via cartPage's checkout.
  // In production this would be a POST /admin/orders webhook or poll.
  const orders = getOrders();
  orders.unshift({
    orderId: order.orderId,
    tokenNumber: order.tokenNumber,
    studentName: "Student",
    rollNumber: "—",
    items: order.items.map((i) => ({ name: i.name, qty: i.quantity })),
    totalAmount: order.totalAmount,
    status: ORDER_STATUSES.PLACED,
    placedAt: order.placedAt,
  });
  saveOrders(orders);
}

/* ==========================================================
   Print job mutations
========================================================== */

export function updatePrintJobStatus(jobId, newStatus) {
  const jobs = getPrintJobs();
  const job = jobs.find((j) => j.jobId === jobId);
  if (!job) return false;
  job.status = newStatus;
  savePrintJobs(jobs);
  return true;
}

/* ==========================================================
   Dashboard stats
========================================================== */

export function getDashboardStats() {
  const orders = getOrders();
  const printJobs = getPrintJobs();

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.placedAt).toDateString() === today
  );

  const activeTokens = orders.filter(
    (o) => [ORDER_STATUSES.PLACED, ORDER_STATUSES.PREPARING, ORDER_STATUSES.READY].includes(o.status)
  ).length;

  const pendingPrintJobs = printJobs.filter(
    (j) => j.status !== PRINT_JOB_STATUSES.COMPLETED
  ).length;

  const revenueToday = todayOrders
    .filter((o) => o.status !== ORDER_STATUSES.CANCELLED)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    totalOrdersToday: todayOrders.length,
    activeTokens,
    pendingPrintJobs,
    revenueToday,
  };
}