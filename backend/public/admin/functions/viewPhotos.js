import { api } from "./api.js";
import { esc } from "./esc.js";
import { errorCard } from "./errorCard.js";
import { CARD, CARD_TITLE } from "./styles.js";

export async function viewPhotos(userId) {
  const panel = document.getElementById("photoPanel");
  panel.innerHTML = `<div class="${CARD} mt-5"><p class="text-sm text-gray-500">Loading photos...</p></div>`;
  try {
    const d = await api(`/api/admin/users/${userId}/profile`);
    const photos = d.profile.photos || [];
    const photoItems = photos.map((url) => `
      <div class="relative">
        <img src="${esc(url)}" class="w-24 h-24 object-cover rounded-lg ring-1 ring-gray-200" />
        <button class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow hover:bg-red-600" data-action="remove-photo" data-user="${userId}" data-url="${esc(url)}">✕</button>
      </div>
    `).join("");
    panel.innerHTML = `
      <div class="${CARD} mt-5">
        <h3 class="${CARD_TITLE}">${esc(d.profile.name) || "Profile"} — Photos</h3>
        <div class="flex flex-wrap gap-3">${photoItems || `<p class="text-sm text-gray-400">No photos</p>`}</div>
      </div>
    `;
  } catch (err) {
    panel.innerHTML = errorCard(err.message);
  }
}
