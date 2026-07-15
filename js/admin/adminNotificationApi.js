const BASE_URL = "http://localhost:8080/api/v1/notifications";

function getAdmin() {
    return JSON.parse(sessionStorage.getItem("skipq_admin"));
}

async function request(url, options = {}) {

    const admin = getAdmin();

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(admin?.token ? { Authorization: `Bearer ${admin.token}` } : {})
        },
        ...options
    });

    if (!response.ok) {
        throw new Error("Notification request failed");
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export function getNotifications() {
    return request(`${BASE_URL}/admin`);
}


export function markAllAsRead() {

    return request(`${BASE_URL}/admin/read-all`, {
        method: "PUT"
    });

}
export async function getUnreadCount() {

    const response = await request(`${BASE_URL}/admin/unread-count`);

    return response.unreadCount;

}
export function markAsRead(notificationId) {

    return request(`${BASE_URL}/${notificationId}/read`, {
        method: "PUT"
    });

}