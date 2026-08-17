import { api } from "./api.js";
import { viewPhotos } from "./viewPhotos.js";

export async function removePhoto(userId, url) {
  if (!confirm("Remove this photo?")) return;
  try {
    await api(`/api/admin/users/${userId}/photo`, { method: "DELETE", body: JSON.stringify({ url }) });
    viewPhotos(userId);
  } catch (err) {
    alert(err.message);
  }
}
