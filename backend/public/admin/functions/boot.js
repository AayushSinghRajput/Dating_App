import { getToken } from "./state.js";
import { api } from "./api.js";
import { switchTab } from "./switchTab.js";
import { doLogout } from "./doLogout.js";

export async function boot() {
  if (!getToken()) return;
  try {
    await api("/api/admin/analytics"); // also doubles as an admin-access check
    document.getElementById("loginView").style.display = "none";
    document.getElementById("appView").style.display = "block";
    switchTab("analytics");
  } catch (err) {
    doLogout();
  }
}
