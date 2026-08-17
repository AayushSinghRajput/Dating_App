import { api } from "./api.js";
import { loadReports } from "./loadReports.js";

export async function resolveReport(reportId, action) {
  if (action === "ban" && !confirm("Ban this user?")) return;
  try {
    await api(`/api/admin/reports/${reportId}/resolve`, { method: "POST", body: JSON.stringify({ action }) });
    loadReports();
  } catch (err) {
    alert(err.message);
  }
}
