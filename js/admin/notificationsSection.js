import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} from "./adminNotificationApi.js";
const POLL_INTERVAL = 5000;
let pollTimer = null;

export function initNotificationsSection() {



    const container = document.getElementById("notificationsList");

    if (!container) return;

    loadNotifications();
    loadUnreadBadge();
    const markAllButton = document.getElementById("markAllReadBtn");

    markAllButton?.addEventListener("click", async () => {

        try {

            await markAllAsRead();

            await loadNotifications();

            await loadUnreadBadge();

        } catch (error) {

            console.error(error);

        }

    });

    if (pollTimer) {
        clearInterval(pollTimer);
    }

    pollTimer = setInterval(() => {

        loadNotifications();
        loadUnreadBadge();

    }, POLL_INTERVAL);
}


async function loadNotifications() {

    const container = document.getElementById("notificationsList");

    try {

        const notifications = await getNotifications();

        if (notifications.length === 0) {

            container.innerHTML = `
                <div class="notification-card">
                    <div class="notification-message">
                        No notifications yet.
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML = notifications.map(notification => `

<div class="notification-card
    notification-${notification.type.toLowerCase()}
    ${notification.read ? "" : "notification-unread"}">

    <div class="notification-icon">
        ${getNotificationIcon(notification.type)}
    </div>

    <div class="notification-content">

        <div class="notification-header">

            <div class="notification-type">
                ${formatType(notification.type)}
            </div>

            <div class="notification-time">
                ${timeAgo(notification.createdAt)}
            </div>

        </div>

        <div class="notification-message">
            ${notification.message}
        </div>

        ${notification.tokenNumber != null
            ? `
            <div class="notification-token">
                Token #${notification.tokenNumber}
            </div>
            `
            : ""
        }

        <div class="notification-actions">

            ${!notification.read
                ? `
                <button class="notification-read-btn"
                        data-id="${notification.id}">
                    Mark Read
                </button>
                `
                : ""
            }

        </div>

    </div>

    ${!notification.read
        ? `<div class="notification-dot"></div>`
        : ""
    }

</div>

`).join("");
        document.querySelectorAll(".notification-read-btn").forEach(button => {

            button.addEventListener("click", async () => {

                try {

                    await markAsRead(button.dataset.id);

                    await loadNotifications();

                    await loadUnreadBadge();

                } catch (error) {

                    console.error(error);

                }

            });

        });


    } catch (error) {

        console.error(error);

    }

}

function formatType(type){

    switch(type){

        case "NEW_ORDER":
            return "📦 New Order";

        case "LOW_STOCK":
            return "⚠️ Low Stock";

        case "OUT_OF_STOCK":
            return "🚫 Out Of Stock";

        case "ORDER_CANCELLED":
            return "❌ Order Cancelled";

        default:
            return type
                .replaceAll("_"," ")
                .toLowerCase()
                .replace(/\b\w/g,c=>c.toUpperCase());

    }

}
function getNotificationIcon(type) {

    switch (type) {

        case "NEW_ORDER":
            return `
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
                <path d="M3 6h2l2.5 9h9l2-7H7" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="10" cy="19" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="19" r="1.5" fill="currentColor"/>
            </svg>
            `;

        case "LOW_STOCK":
            return `
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
                <path d="M12 3L2 21h20L12 3z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"/>
                <path d="M12 9v5" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
            </svg>
            `;

        case "OUT_OF_STOCK":
            return `
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
                <circle cx="12" cy="12" r="9"
                        stroke="currentColor"
                        stroke-width="2"/>
                <path d="M7 7l10 10"
                      stroke="currentColor"
                      stroke-width="2"/>
            </svg>
            `;

        case "ORDER_CANCELLED":
            return `
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
                <path d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"/>
            </svg>
            `;

        default:
            return "";
    }

}

function timeAgo(date) {

    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

    if (seconds < 60) return "Just now";

    if (seconds < 3600)
        return `${Math.floor(seconds / 60)} min ago`;

    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)} hr ago`;

    return `${Math.floor(seconds / 86400)} day ago`;

}

async function loadUnreadBadge() {
    console.log("Unread badge function called");

    const badge = document.getElementById("notificationBadge");

    if (!badge) return;

    try {

        const unread = await getUnreadCount();
        console.log("Unread =", unread);

        badge.textContent = unread;

        badge.hidden = unread === 0;

    } catch (error) {

        console.error(error);

    }

}