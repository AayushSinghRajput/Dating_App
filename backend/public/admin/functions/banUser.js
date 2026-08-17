import { api } from "./api.js";
import { loadUsers } from "./loadUsers.js";

export async function banUser(userId) {
  const reason = prompt("Ban reason (optional):") || "";
  try {
    await api(`/api/admin/users/${userId}/ban`, { method: "POST", body: JSON.stringify({ reason }) });
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}
