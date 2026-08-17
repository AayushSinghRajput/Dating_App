import { api } from "./api.js";
import { esc } from "./esc.js";
import { badge } from "./badge.js";
import { actionBtn } from "./actionBtn.js";
import { loadingCard } from "./loadingCard.js";
import { errorCard } from "./errorCard.js";
import { CARD, TABLE_HEAD_CELL, TABLE_ROW, TABLE_CELL } from "./styles.js";

export async function loadReports() {
  const el = document.getElementById("reportsTab");
  el.innerHTML = loadingCard();
  try {
    const d = await api("/api/admin/reports?status=open");
    const rows = d.reports.map((r) => `
      <tr class="${TABLE_ROW}">
        <td class="${TABLE_CELL}">${esc(r.reporter?.username) || "?"}</td>
        <td class="${TABLE_CELL}">${esc(r.reportedUser?.username) || "?"} ${r.reportedUser?.banned ? badge("Banned", "red") : ""}</td>
        <td class="${TABLE_CELL}">${esc(r.reason)}</td>
        <td class="${TABLE_CELL} max-w-xs truncate">${esc(r.details)}</td>
        <td class="${TABLE_CELL} whitespace-nowrap">
          ${actionBtn({ action: "dismiss-report", id: r._id, label: "Dismiss" })}
          ${actionBtn({ action: "ban-report", id: r._id, label: "Ban User", danger: true })}
        </td>
      </tr>
    `).join("");
    el.innerHTML = `<div class="${CARD}"><table class="w-full text-sm">
      <thead><tr class="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
        <th class="${TABLE_HEAD_CELL}">Reporter</th><th class="${TABLE_HEAD_CELL}">Reported</th><th class="${TABLE_HEAD_CELL}">Reason</th><th class="${TABLE_HEAD_CELL}">Details</th><th class="${TABLE_HEAD_CELL}">Actions</th>
      </tr></thead>
      <tbody>${rows || `<tr><td class="py-4 text-gray-400" colspan="5">No open reports 🎉</td></tr>`}</tbody>
    </table></div>`;
  } catch (err) {
    el.innerHTML = errorCard(err.message);
  }
}
