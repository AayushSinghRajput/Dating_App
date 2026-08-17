import { setToken } from "./state.js";

export function doLogout() {
  localStorage.removeItem("admin_token");
  setToken("");
  document.getElementById("appView").style.display = "none";
  document.getElementById("loginView").style.display = "block";
}
