// js/utils/validators.js
// Small, dependency-free validation helpers shared across forms.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @param {string} value */
export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * @param {string} value
 * @param {number} [minLength=6]
 */
export function isValidPassword(value, minLength = 6) {
  return typeof value === "string" && value.length >= minLength;
}

/** @param {string} value */
export function isRequired(value) {
  return typeof value === "string" && value.trim().length > 0;
}