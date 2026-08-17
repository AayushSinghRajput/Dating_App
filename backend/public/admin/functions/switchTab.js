import { ACTIVE_TAB_CLASSES, INACTIVE_TAB_CLASSES } from "./styles.js";
import { loadAnalytics } from "./loadAnalytics.js";
import { loadReports } from "./loadReports.js";
import { loadUsers } from "./loadUsers.js";

export function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t) => {
    const isActive = t.dataset.tab === name;
    t.classList.remove(...ACTIVE_TAB_CLASSES, ...INACTIVE_TAB_CLASSES);
    t.classList.add(...(isActive ? ACTIVE_TAB_CLASSES : INACTIVE_TAB_CLASSES));
  });
  ["analytics", "reports", "users"].forEach((t) => {
    document.getElementById(t + "Tab").style.display = t === name ? "block" : "none";
  });
  if (name === "analytics") loadAnalytics();
  if (name === "reports") loadReports();
  if (name === "users") loadUsers();
}
