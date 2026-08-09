const API = "";
let token = localStorage.getItem("admin_token") || "";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function authHeaders() {
  return { Authorization: "Bearer " + token };
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...authHeaders(), "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    token = data.token;
    localStorage.setItem("admin_token", token);
    await boot();
  } catch (err) {
    document.getElementById("loginError").textContent = err.message;
  }
}

function doLogout() {
  localStorage.removeItem("admin_token");
  token = "";
  document.getElementById("appView").style.display = "none";
  document.getElementById("loginView").style.display = "block";
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  ["analytics", "reports", "users"].forEach((t) => {
    document.getElementById(t + "Tab").style.display = t === name ? "block" : "none";
  });
  if (name === "analytics") loadAnalytics();
  if (name === "reports") loadReports();
  if (name === "users") loadUsers();
}

async function loadAnalytics() {
  const el = document.getElementById("analyticsTab");
  el.innerHTML = "<p class='muted'>Loading...</p>";
  try {
    const d = await api("/api/admin/analytics");
    el.innerHTML = `
      <div class="card">
        <div class="stats">
          <div class="stat"><div class="value">${d.totalUsers}</div><div class="label">Total Users</div></div>
          <div class="stat"><div class="value">${d.dau}</div><div class="label">DAU</div></div>
          <div class="stat"><div class="value">${d.wau}</div><div class="label">WAU</div></div>
          <div class="stat"><div class="value">${d.totalMatches}</div><div class="label">Total Matches</div></div>
          <div class="stat"><div class="value">${d.retentionRate7d === null ? "—" : d.retentionRate7d + "%"}</div><div class="label">7-Day Retention</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Signups (last 30 days)</h3>
        <table>
          <tr><th>Date</th><th>Signups</th></tr>
          ${d.signupsByDay.map((s) => `<tr><td>${esc(s.date)}</td><td>${s.count}</td></tr>`).join("") || "<tr><td colspan=2>No data yet</td></tr>"}
        </table>
      </div>
    `;
  } catch (err) {
    el.innerHTML = "<p class='muted'>" + esc(err.message) + "</p>";
  }
}

async function loadReports() {
  const el = document.getElementById("reportsTab");
  el.innerHTML = "<p class='muted'>Loading...</p>";
  try {
    const d = await api("/api/admin/reports?status=open");
    const rows = d.reports.map((r) => `
      <tr>
        <td>${esc(r.reporter?.username) || "?"}</td>
        <td>${esc(r.reportedUser?.username) || "?"} ${r.reportedUser?.banned ? "<span class='badge banned'>Banned</span>" : ""}</td>
        <td>${esc(r.reason)}</td>
        <td>${esc(r.details)}</td>
        <td>
          <button class="action" data-action="dismiss-report" data-id="${r._id}">Dismiss</button>
          <button class="action danger" data-action="ban-report" data-id="${r._id}">Ban User</button>
        </td>
      </tr>
    `).join("");
    el.innerHTML = `<div class="card"><table>
      <tr><th>Reporter</th><th>Reported</th><th>Reason</th><th>Details</th><th>Actions</th></tr>
      ${rows || "<tr><td colspan=5>No open reports 🎉</td></tr>"}
    </table></div>`;
  } catch (err) {
    el.innerHTML = "<p class='muted'>" + esc(err.message) + "</p>";
  }
}

async function resolveReport(reportId, action) {
  if (action === "ban" && !confirm("Ban this user?")) return;
  try {
    await api(`/api/admin/reports/${reportId}/resolve`, { method: "POST", body: JSON.stringify({ action }) });
    loadReports();
  } catch (err) {
    alert(err.message);
  }
}

let userSearch = "";
function renderUserSearchBox() {
  return `<div class="card">
    <input type="text" placeholder="Search by username or email" id="userSearchInput" value="${esc(userSearch)}" />
  </div>`;
}

async function loadUsers() {
  const el = document.getElementById("usersTab");
  el.innerHTML = renderUserSearchBox() + `<div class="card"><p class="muted">Loading...</p></div>`;
  try {
    const d = await api("/api/admin/users?search=" + encodeURIComponent(userSearch));
    const rows = d.users.map((u) => `
      <tr>
        <td>${esc(u.username)}</td>
        <td>${esc(u.email)}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td>
          ${u.banned ? "<span class='badge banned'>Banned</span>" : ""}
          ${u.isPremium ? "<span class='badge premium'>Premium</span>" : ""}
          ${u.isAdmin ? "<span class='badge admin'>Admin</span>" : ""}
        </td>
        <td>
          ${u.banned
            ? `<button class="action" data-action="unban" data-id="${u._id}">Unban</button>`
            : `<button class="action danger" data-action="ban" data-id="${u._id}">Ban</button>`}
          <button class="action" data-action="photos" data-id="${u._id}">Photos</button>
        </td>
      </tr>
    `).join("");
    el.innerHTML = renderUserSearchBox() + `
      <div class="card">
        <table><tr><th>Username</th><th>Email</th><th>Joined</th><th>Status</th><th>Actions</th></tr>${rows || "<tr><td colspan=5>No users found</td></tr>"}</table>
      </div>
      <div id="photoPanel"></div>
    `;
    document.getElementById("userSearchInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        userSearch = e.target.value;
        loadUsers();
      }
    });
  } catch (err) {
    el.innerHTML = "<p class='muted'>" + esc(err.message) + "</p>";
  }
}

async function banUser(userId) {
  const reason = prompt("Ban reason (optional):") || "";
  try {
    await api(`/api/admin/users/${userId}/ban`, { method: "POST", body: JSON.stringify({ reason }) });
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function unbanUser(userId) {
  try {
    await api(`/api/admin/users/${userId}/unban`, { method: "POST" });
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function viewPhotos(userId) {
  const panel = document.getElementById("photoPanel");
  panel.innerHTML = "<div class='card'><p class='muted'>Loading photos...</p></div>";
  try {
    const d = await api(`/api/admin/users/${userId}/profile`);
    const photos = d.profile.photos || [];
    const photoItems = photos.map((url) => `
      <div class="photo-item">
        <img src="${esc(url)}" />
        <button class="action danger" data-action="remove-photo" data-user="${userId}" data-url="${esc(url)}">✕</button>
      </div>
    `).join("");
    panel.innerHTML = `
      <div class="card">
        <h3>${esc(d.profile.name) || "Profile"} — Photos</h3>
        <div class="photo-grid">${photoItems || "<p class='muted'>No photos</p>"}</div>
      </div>
    `;
  } catch (err) {
    panel.innerHTML = "<p class='muted'>" + esc(err.message) + "</p>";
  }
}

async function removePhoto(userId, url) {
  if (!confirm("Remove this photo?")) return;
  try {
    await api(`/api/admin/users/${userId}/photo`, { method: "DELETE", body: JSON.stringify({ url }) });
    viewPhotos(userId);
  } catch (err) {
    alert(err.message);
  }
}

// Single delegated listener handles every dynamically-rendered action button
// (avoids inline onclick="", which a strict CSP blocks and which would also
// require attribute-context escaping for every interpolated value above).
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

async function boot() {
  if (!token) return;
  try {
    await api("/api/admin/analytics"); // also doubles as an admin-access check
    document.getElementById("loginView").style.display = "none";
    document.getElementById("appView").style.display = "block";
    switchTab("analytics");
  } catch (err) {
    doLogout();
  }
}

document.getElementById("loginBtn").addEventListener("click", doLogin);
document.getElementById("logoutBtn").addEventListener("click", doLogout);
document.querySelectorAll(".tab").forEach((el) => {
  el.addEventListener("click", () => switchTab(el.dataset.tab));
});

boot();
