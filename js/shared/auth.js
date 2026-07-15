// js/shared/auth.js

import { clearCart } from "../student/cartStore.js";
import { showToast } from "./toast.js";

const STUDENT_KEY = "skipq_student";

export function getSession() {
    const raw = sessionStorage.getItem(STUDENT_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function setSession(student) {
    sessionStorage.setItem(STUDENT_KEY, JSON.stringify(student));
}

export function clearSession() {
    sessionStorage.removeItem(STUDENT_KEY);
}

export function isLoggedIn() {
    return getSession() !== null;
}

/** The JWT issued at login, stored alongside the rest of the session. */
export function getToken() {
    return getSession()?.token ?? null;
}

export function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "./login.html";
    }
}

export function logout() {
    clearSession();
    clearCart();

    showToast("Logged out successfully", "info", 1500);

    setTimeout(() => {
        const depth = window.location.pathname.split("/").filter(Boolean).length;
        const prefix = depth > 1 ? "../".repeat(depth - 1) : "./";
        window.location.href = `${prefix}student/login.html`;
    }, 900);
}