import { api } from "./api.js";
import { esc } from "./esc.js";
import { badge } from "./badge.js";
import { actionBtn } from "./actionBtn.js";
import { loadingCard } from "./loadingCard.js";
import { errorCard } from "./errorCard.js";
import { renderUserSearchBox } from "./renderUserSearchBox.js";
import { getUserSearch, setUserSearch } from "./state.js";
import { CARD, TABLE_HEAD_CELL, TABLE_ROW, TABLE_CELL } from "./styles.js";

export async function loadUsers() {
  const el = document.getElementById("usersTab");
  el.innerHTML = renderUserSearchBox() + loadingCard();
  try {
    const d = await api("/api/admin/users?search=" + encodeURIComponent(getUserSearch()));
    const rows = d.users.map((u) => `
      <tr class="${TABLE_ROW}">
        <td class="${TABLE_CELL}">${esc(u.username)}</td>
        <td class="${TABLE_CELL}">${esc(u.email)}</td>
        <td class="${TABLE_CELL}">${new Date(u.createdAt).toLocaleDateString()}</td>
        <td class="${TABLE_CELL} space-x-1">
          ${u.banned ? badge("Banned", "red") : ""}
          ${u.isPremium ? badge("Premium", "brand") : ""}
          ${u.isAdmin ? badge("Admin", "blue") : ""}
        </td>
        <td class="${TABLE_CELL} whitespace-nowrap">
          ${u.banned
            ? actionBtn({ action: "unban", id: u._id, label: "Unban" })
            : actionBtn({ action: "ban", id: u._id, label: "Ban", danger: true })}
          ${actionBtn({ action: "photos", id: u._id, label: "Photos" })}
        </td>
      </tr>
    `).join("");
    el.innerHTML = renderUserSearchBox() + `
      <div class="${CARD}">
        <table class="w-full text-sm">
          <thead><tr class="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <th class="${TABLE_HEAD_CELL}">Username</th><th class="${TABLE_HEAD_CELL}">Email</th><th class="${TABLE_HEAD_CELL}">Joined</th><th class="${TABLE_HEAD_CELL}">Status</th><th class="${TABLE_HEAD_CELL}">Actions</th>
          </tr></thead>
          <tbody>${rows || `<tr><td class="py-4 text-gray-400" colspan="5">No users found</td></tr>`}</tbody>
        </table>
      </div>
      <div id="photoPanel"></div>
    `;
    document.getElementById("userSearchInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        setUserSearch(e.target.value);
        loadUsers();
      }
    });
  } catch (err) {
    el.innerHTML = errorCard(err.message);
  }
}
