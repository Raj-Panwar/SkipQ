import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead
} from "./notificationApi.js";

let notificationPollHandle = null;
let previousUnreadCount = 0;
export function initNotifications(studentId, pollIntervalMs = 15000) {
    refreshNotifications(studentId);
    notificationPollHandle = setInterval(() => refreshNotifications(studentId), pollIntervalMs);

    const bell = document.getElementById("notificationBell");
    if (bell) {
        bell.addEventListener("click", () => toggleNotificationPanel(studentId));
    }
}

async function refreshNotifications(studentId) {
    try {
        const data = await getUnreadCount(studentId);
        const unread = data.unreadCount;

        if (unread > previousUnreadCount) {
            const notifications = await getNotifications(studentId);

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

    badge.hidden = false;
    badge.textContent = count;
    const bell = document.getElementById("notificationBell");

    if (count > 0) {
        bell.classList.add("new");

        setTimeout(() => {
            bell.classList.remove("new");
        }, 400);
    }
}

async function toggleNotificationPanel(studentId) {
    const panel = document.getElementById("notificationPanel");
    if (!panel) return;

    const isOpening = panel.hidden;

    if (isOpening) {
        await loadNotificationList(studentId);
        panel.hidden = false;
    } else {
        panel.hidden = true;
    }
}

async function loadNotificationList(studentId) {
    const list = document.getElementById("notificationList");
    if (!list) return;

    try {
        const notifications = await getNotifications(studentId);

        list.innerHTML = "";

        if (notifications.length === 0) {
            list.innerHTML = "<li>No notifications yet.</li>";
        } else {
            notifications.forEach(n => {
                const item = document.createElement("li");
                item.className = n.read ? "notif-read" : "notif-unread";
                let icon = "🔔";

                switch (n.type) {
                    case "READY":
                        icon = "🟢";
                        break;
                    case "COMPLETED":
                        icon = "✅";
                        break;
                    case "CANCELLED":
                        icon = "❌";
                        break;
                }

                item.innerHTML = `
    <div class="notification-item">
        <div class="notification-icon">${icon}</div>

        <div class="notification-content">
            <div class="notification-message">${n.message}</div>
            <div class="notification-time">
                ${formatTimeAgo(n.createdAt)}
            </div>
        </div>
    </div>
`;
                list.appendChild(item);
            });
        }

        // mark all as read now that the student has opened the panel
        await markAllNotificationsRead(studentId);
        updateBadge(0);

    } catch (err) {
        console.error("Failed to load notifications:", err);
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

    return Math.floor(seconds / 86400) + " day ago";
}
function showToast(notification) {

    const toast = document.createElement("div");
    toast.className = "notification-toast";

    let icon = "🔔";

    switch (notification.type) {
        case "READY":
            icon = "🟢";
            break;
        case "COMPLETED":
            icon = "✅";
            break;
        case "CANCELLED":
            icon = "❌";
            break;
    }

    toast.innerHTML = `
        <div class="toast-title">
            ${icon} ${notification.type}
        </div>

        <div class="toast-message">
            ${notification.message}
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