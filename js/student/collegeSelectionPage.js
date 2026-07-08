import { getCollegeByCode } from "../api/collegeApi.js";
const SELECTED_COLLEGE_CODE_KEY = "selectedCollegeCode";
const SELECTED_COLLEGE_NAME_KEY = "selectedCollegeName";
const form = document.getElementById("collegeSelectionForm");
const collegeCodeInput = document.getElementById("collegeCode");
const collegeCodeError = document.getElementById("collegeCodeError");
const formAlert = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const savedCode = sessionStorage.getItem(SELECTED_COLLEGE_CODE_KEY);
if (savedCode) {
  collegeCodeInput.value = savedCode;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAlert();
  const collegeCode = collegeCodeInput.value.trim();
  if (!collegeCode) {
    showFieldError("College code is required.");
    return;
  }
  clearFieldError();
  setLoading(true);
  try {
    const college = await getCollegeByCode(collegeCode);
if (!college.active) {
  showAlert("This college is not active yet.");
  return;
}

sessionStorage.setItem(SELECTED_COLLEGE_CODE_KEY, college.code);
sessionStorage.setItem(SELECTED_COLLEGE_NAME_KEY, college.name);
window.location.href = "./login.html";
  } catch (error) {
    showAlert(error.message || "Enter a valid college code.");
  } finally {
    setLoading(false);
  }
});
function showFieldError(message) {
  collegeCodeInput.classList.add("is-invalid");
  collegeCodeError.textContent = message;
  collegeCodeError.hidden = false;
}
function clearFieldError() {
  collegeCodeInput.classList.remove("is-invalid");
  collegeCodeError.textContent = "";
  collegeCodeError.hidden = true;
}
function showAlert(message) {
  formAlert.textContent = message;
  formAlert.hidden = false;
}
function hideAlert() {
  formAlert.textContent = "";
  formAlert.hidden = true;
}
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}