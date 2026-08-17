import { api } from "./api.js";
import { loadUsers } from "./loadUsers.js";

export async function unbanUser(userId) {
  try {
    await api(`/api/admin/users/${userId}/unban`, { method: "POST" });
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}
