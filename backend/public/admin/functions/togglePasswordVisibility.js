import { EYE_ICON, EYE_OFF_ICON } from "./styles.js";

export function togglePasswordVisibility() {
  const input = document.getElementById("loginPassword");
  const icon = document.getElementById("eyeIcon");
  const btn = document.getElementById("togglePasswordBtn");
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  icon.innerHTML = showing ? EYE_ICON : EYE_OFF_ICON;
  btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
}
