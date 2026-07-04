/**
 * SkipQ Shared Pagination Component
 *
 * Renders reusable pagination controls for any Spring Boot Page<T> response.
 *
 * Supports:
 * - Previous / Next navigation
 * - Page numbers
 * - Ellipsis for large page counts
 * - Active page highlighting
 * - Disabled navigation states
 *
 * Intended for:
 * - Orders
 * - Inventory
 * - Student History
 * - Notifications
 * - Future admin listings

 */

/**
 * Renders Prev / page-number / Next controls for any Spring Page<T> response,
 * and wires them to a callback. Entity-agnostic — reusable for Orders,
 * Inventory, and future Students listings without modification.
 *
 * @param {string} containerId   - element to render controls into
 * @param {object} pageData      - Spring Page<T> JSON: {number, totalPages, first, last, ...}
 * @param {function} onPageChange - called with the new page index when clicked
 */

export function renderPagination(containerId, pageData, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (pageData.totalPages <= 1) {
    container.innerHTML = "";
    return;
}

    container.innerHTML = "";
    container.className = "skipq-pagination";

    const current = pageData.number;
    const totalPages = pageData.totalPages || 1;

    const prevBtn = document.createElement("button");
    prevBtn.className = "skipq-page-btn";
    prevBtn.innerHTML = "<"
    prevBtn.setAttribute("aria-label", "Previous page");
    prevBtn.disabled = pageData.first;
    prevBtn.addEventListener("click", () => onPageChange(current - 1));
    container.appendChild(prevBtn);

    // Show a window of page numbers around the current page (max 5)
    const windowSize = 5;
    let start = Math.max(0, current - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize);
    start = Math.max(0, end - windowSize);

    if (start > 0) {
        container.appendChild(makePageButton(0, current, onPageChange));
        if (start > 1) container.appendChild(makeEllipsis());
    }

    for (let i = start; i < end; i++) {
        container.appendChild(makePageButton(i, current, onPageChange));
    }

    if (end < totalPages) {
        if (end < totalPages - 1) container.appendChild(makeEllipsis());
        container.appendChild(makePageButton(totalPages - 1, current, onPageChange));
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "skipq-page-btn";
    nextBtn.innerHTML = ">"
    nextBtn.setAttribute("aria-label", "Next page");
    nextBtn.disabled = pageData.last;
    nextBtn.addEventListener("click", () => onPageChange(current + 1));
    container.appendChild(nextBtn);
}

function makePageButton(index, current, onPageChange) {
    const btn = document.createElement("button");
    btn.textContent = index + 1;
    btn.className = index === current ? "skipq-page-btn active" : "skipq-page-btn";
    btn.disabled = index === current;
    btn.setAttribute("aria-label", `Page ${index + 1}`);
    btn.addEventListener("click", () => onPageChange(index));
    return btn;
}

function makeEllipsis() {
    const span = document.createElement("span");
    span.textContent = "…";
    span.className = "skipq-page-ellipsis";
    return span;
}

/** Shows/hides a loading indicator around any async list-fetch call. */
/*export function showLoading(loaderId) {
    const el = document.getElementById(loaderId);
    if (el) el.style.display = "inline-block";
}

export function hideLoading(loaderId) {
    const el = document.getElementById(loaderId);
    if (el) el.style.display = "none";
}*/