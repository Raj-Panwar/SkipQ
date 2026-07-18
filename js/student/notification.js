import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead
} from "./notificationApi.js";

let notificationPollHandle = null;
let previousUnreadCount = null;

// Small inline-SVG icon set, matching the stroke-based icon style already
// used for the header bell/cart icons — replaces the previous emoji icons.
const NOTIFICATION_ICONS = {
    READY: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
        <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    COMPLETED: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3a5 5 0 0 0-5 5v2.3c0 .7-.2 1.3-.6 1.9L5 14.5V16h14v-1.5l-1.4-2.3c-.4-.6-.6-1.2-.6-1.9V8a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
    CANCELLED: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
        <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
    DEFAULT: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3a5 5 0 0 0-5 5v2.3c0 .7-.2 1.3-.6 1.9L5 14.5V16h14v-1.5l-1.4-2.3c-.4-.6-.6-1.2-.6-1.9V8a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
};

const NOTIFICATION_ICON_CLASS = {
    READY: "notification-icon-ready",
    COMPLETED: "notification-icon-completed",
    CANCELLED: "notification-icon-cancelled",
};

function getNotificationIcon(type) {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.DEFAULT;
}

function getNotificationIconClass(type) {
    return NOTIFICATION_ICON_CLASS[type] || "";
}

export function initNotifications(pollIntervalMs = 15000) {
    refreshNotifications();
    if (notificationPollHandle) {
        clearInterval(notificationPollHandle);
    }
    notificationPollHandle = setInterval(() => refreshNotifications(), pollIntervalMs);

    const bell = document.getElementById("notificationBell");
    if (bell) {
        bell.addEventListener("click", () => toggleNotificationPanel());
    }

    const markAllBtn = document.getElementById("markAllReadBtn");
    if (markAllBtn) {
        markAllBtn.addEventListener("click", () => handleMarkAllRead());
    }
}

async function refreshNotifications() {
    try {
        const data = await getUnreadCount();
        const unread = data.unreadCount;

        if (previousUnreadCount === null) {
            previousUnreadCount = unread;
            updateBadge(unread);
            return;
        }

        if (unread > previousUnreadCount) {
            const notifications = await getNotifications();

            if (notifications.length > 0) {
                showToast(notifications[0]);
            }
        }

        previousUnreadCount = unread;
        updateBadge(unread);
    } catch (err) {
        console.error("Notification poll failed:", err);
    }
}

function updateBadge(count) {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    badge.hidden = count <= 0;
    badge.textContent = count;
    const bell = document.getElementById("notificationBell");

    if (bell && count > 0) {
        bell.classList.add("new");

        setTimeout(() => {
            bell.classList.remove("new");
        }, 400);
    }
}

async function toggleNotificationPanel() {
    const panel = document.getElementById("notificationPanel");
    if (!panel) return;

    const isOpening = panel.hidden;

    if (isOpening) {
        panel.hidden = false;
        await loadNotificationList();
        
    } else {
        panel.hidden = true;
    }
}

async function loadNotificationList() {
    const list = document.getElementById("notificationList");
    if (!list) return;

    list.innerHTML = Array.from({ length: 3 }, () => `
      <li class="notification-skeleton-item">
        <div class="notification-item">
          <div class="skeleton-circle" style="width:22px;height:22px;"></div>
          <div class="notification-content">
            <div class="skeleton-text" style="width:85%;"></div>
            <div class="skeleton-text" style="width:35%;margin-top:6px;height:9px;"></div>
          </div>
        </div>
      </li>`).join("");

    try {
        const notifications = await getNotifications();

        list.innerHTML = "";

        if (notifications.length === 0) {
            list.innerHTML = `
              <li class="notification-empty">
                <div class="notification-empty-icon" aria-hidden="true">${NOTIFICATION_ICONS.DEFAULT}</div>
                <p class="notification-empty-title">You're all caught up</p>
                <p class="notification-empty-text">New order updates will show up here.</p>
              </li>`;
        } else {
            notifications.forEach(n => {
                const item = document.createElement("li");
                item.className = n.read ? "notif-read" : "notif-unread";
                item.dataset.id = n.id;

                item.innerHTML = `
    <div class="notification-item">
        <div class="notification-icon ${getNotificationIconClass(n.type)}">${getNotificationIcon(n.type)}</div>

        <div class="notification-content">
            <div class="notification-message">${n.message}</div>
            <div class="notification-time">
                ${formatTimeAgo(n.createdAt)}
            </div>
        </div>

        ${!n.read
            ? `<button type="button" class="notification-mark-read-btn" data-id="${n.id}">Mark read</button>`
            : ""
        }
    </div>
`;
                list.appendChild(item);
            });

            list.querySelectorAll(".notification-mark-read-btn").forEach(button => {
                button.addEventListener("click", () => handleMarkOneRead(button.dataset.id));
            });
        }

    } catch (err) {
        console.error("Failed to load notifications:", err);
        list.innerHTML = `
          <li class="notification-empty">
            <p class="notification-empty-title">Couldn't load notifications</p>
            <p class="notification-empty-text">Please try again shortly.</p>
          </li>`;
    }
}

// Marks a single notification read without reloading the whole list —
// updates just that <li> in place and adjusts the badge locally. Polling
// (refreshNotifications) stays responsible for reconciling with the server
// in the background.
async function handleMarkOneRead(id) {
    const list = document.getElementById("notificationList");
    const item = list?.querySelector(`li[data-id="${id}"]`);

    try {
        await markNotificationRead(id);

        if (item) {
            item.className = "notif-read";
            const btn = item.querySelector(".notification-mark-read-btn");
            btn?.remove();
        }

        if (previousUnreadCount !== null && previousUnreadCount > 0) {
            previousUnreadCount -= 1;
        }
        updateBadge(previousUnreadCount ?? 0);
    } catch (err) {
        console.error("Failed to mark notification as read:", err);
    }
}

// Marks everything read via one request, then updates the already-rendered
// list items locally instead of refetching from the server.
async function handleMarkAllRead() {
    const list = document.getElementById("notificationList");

    try {
        await markAllNotificationsRead();

        list?.querySelectorAll("li.notif-unread").forEach(item => {
            item.className = "notif-read";
            item.querySelector(".notification-mark-read-btn")?.remove();
        });

        previousUnreadCount = 0;
        updateBadge(0);
    } catch (err) {
        console.error("Failed to mark all notifications as read:", err);
    }
}
function formatTimeAgo(dateString) {

    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);

    if (seconds < 60)
        return "Just now";

    if (seconds < 3600)
        return Math.floor(seconds / 60) + " min ago";

    if (seconds < 86400)
        return Math.floor(seconds / 3600) + " hr ago";

    return Math.floor(seconds / 86400) + " days ago";
}
function showToast(notification) {

    const toast = document.createElement("div");
    toast.className = "notification-toast";

    toast.innerHTML = `
        <div class="toast-icon ${getNotificationIconClass(notification.type)}" aria-hidden="true">${getNotificationIcon(notification.type)}</div>
        <div class="toast-body">
            <div class="toast-title">${formatToastTitle(notification.type)}</div>
            <div class="toast-message">
                ${notification.message}
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function formatToastTitle(type) {
    switch (type) {
        case "READY":
            return "Order ready";
        case "COMPLETED":
            return "Order collected";
        case "CANCELLED":
            return "Order cancelled";
        default:
            return "Notification";
    }
}