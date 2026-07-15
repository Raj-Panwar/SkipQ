import { request } from "../api/apiClient.js";

const BASE_URL = "/notifications";

export function getNotifications() {
  return request(`${BASE_URL}/student/me`, { auth: true });
}

export function getUnreadCount() {
  return request(`${BASE_URL}/student/me/unread-count`, { auth: true });
}

export function markNotificationRead(id) {
  return request(`${BASE_URL}/${id}/read`, {
    method: "PUT",
    auth: true,
  });
}

export function markAllNotificationsRead() {
  return request(`${BASE_URL}/student/me/read-all`, {
    method: "PUT",
    auth: true,
  });
}