// Entry point only — every piece of actual logic lives in one function per
// file under ./functions/. This file just imports what it needs to wire up
// DOM event listeners and kick off boot().
import { doLogin } from "./functions/doLogin.js";
import { doLogout } from "./functions/doLogout.js";
import { togglePasswordVisibility } from "./functions/togglePasswordVisibility.js";
import { switchTab } from "./functions/switchTab.js";
import { boot } from "./functions/boot.js";
import { resolveReport } from "./functions/resolveReport.js";
import { banUser } from "./functions/banUser.js";
import { unbanUser } from "./functions/unbanUser.js";
import { viewPhotos } from "./functions/viewPhotos.js";
import { removePhoto } from "./functions/removePhoto.js";

// Single delegated listener handles every dynamically-rendered action button
// (avoids inline onclick="", which a strict CSP blocks and which would also
// require attribute-context escaping for every interpolated value in the
// functions that render this markup).
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id, user, url } = btn.dataset;
  if (action === "dismiss-report") resolveReport(id, "dismiss");
  else if (action === "ban-report") resolveReport(id, "ban");
  else if (action === "ban") banUser(id);
  else if (action === "unban") unbanUser(id);
  else if (action === "photos") viewPhotos(id);
  else if (action === "remove-photo") removePhoto(user, url);
});

document.getElementById("loginBtn").addEventListener("click", doLogin);
document.getElementById("logoutBtn").addEventListener("click", doLogout);
document.getElementById("togglePasswordBtn").addEventListener("click", togglePasswordVisibility);
document.querySelectorAll(".tab").forEach((el) => {
  el.addEventListener("click", () => switchTab(el.dataset.tab));
});

boot();
