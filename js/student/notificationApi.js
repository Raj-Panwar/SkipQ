import { request } from "../api/apiClient.js";

const BASE_URL = "/notifications";

export function getNotifications(studentId) {
  return request(`${BASE_URL}/student/${studentId}`);
}
export function getUnreadCount(studentId) {
  return request(`${BASE_URL}/student/${studentId}/unread-count`);
}

export function markNotificationRead(id) {
  return request(`${BASE_URL}/${id}/read`, {
    method: "PUT",
  });
}

export function markAllNotificationsRead(studentId) {
  return request(`${BASE_URL}/student/${studentId}/read-all`, {
    method: "PUT",
  });
}