import { api } from "./api.js";
import { esc } from "./esc.js";
import { fmtPct } from "./fmtPct.js";
import { statBlock } from "./statBlock.js";
import { statsGrid } from "./statsGrid.js";
import { loadingCard } from "./loadingCard.js";
import { errorCard } from "./errorCard.js";
import { CARD, CARD_TITLE, TABLE_HEAD_CELL, TABLE_ROW, TABLE_CELL } from "./styles.js";

export async function loadAnalytics() {
  const el = document.getElementById("analyticsTab");
  el.innerHTML = loadingCard();
  try {
    const d = await api("/api/admin/analytics");
    el.innerHTML = `
      <div class="${CARD}">
        ${statsGrid(
          statBlock(d.totalUsers, "Total Users"),
          statBlock(d.dau, "DAU"),
          statBlock(d.wau, "WAU"),
          statBlock(d.totalMatches, "Total Matches"),
          statBlock(d.retentionRate7d === null ? "—" : d.retentionRate7d + "%", "7-Day Retention")
        )}
      </div>
      <div class="${CARD}">
        <h3 class="${CARD_TITLE}">Signups (last 30 days)</h3>
        <table class="w-full text-sm">
          <thead><tr class="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <th class="${TABLE_HEAD_CELL}">Date</th><th class="${TABLE_HEAD_CELL}">Signups</th>
          </tr></thead>
          <tbody>
            ${d.signupsByDay.map((s) => `<tr class="${TABLE_ROW}"><td class="${TABLE_CELL}">${esc(s.date)}</td><td class="${TABLE_CELL}">${s.count}</td></tr>`).join("") || `<tr><td class="py-4 text-gray-400" colspan="2">No data yet</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="${CARD}">
        <h3 class="${CARD_TITLE}">Recommendation Exposure (last 30 days)</h3>
        <div class="mb-5">
          ${statsGrid(
            statBlock(d.shownUserCount, "Users Shown"),
            statBlock(d.avgExposurePerShownUser === null ? "—" : d.avgExposurePerShownUser, "Avg Impressions/User"),
            statBlock(d.exposureConcentrationTop10Pct === null ? "—" : d.exposureConcentrationTop10Pct + "%", "Top 10% Users' Share")
          )}
        </div>
        <table class="w-full text-sm">
          <thead><tr class="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <th class="${TABLE_HEAD_CELL}">User</th><th class="${TABLE_HEAD_CELL}">Impressions (30d)</th>
          </tr></thead>
          <tbody>
            ${d.topExposedUsers.map((u) => `<tr class="${TABLE_ROW}"><td class="${TABLE_CELL}">${esc(u.username)}</td><td class="${TABLE_CELL}">${u.impressions}</td></tr>`).join("") || `<tr><td class="py-4 text-gray-400" colspan="2">No data yet</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="${CARD}">
        <h3 class="${CARD_TITLE}">Recommendation Funnel (last 30 days)</h3>
        ${statsGrid(
          statBlock(d.recommendationFunnel.impressions, "Impressions"),
          statBlock(fmtPct(d.recommendationFunnel.profileViewRate), "Profile View Rate"),
          statBlock(fmtPct(d.recommendationFunnel.likeRate), "Like Rate"),
          statBlock(fmtPct(d.recommendationFunnel.passRate), "Pass Rate"),
          statBlock(fmtPct(d.recommendationFunnel.matchRate), "Match Rate"),
          statBlock(fmtPct(d.recommendationFunnel.messageInitiationRate), "Message Initiation Rate"),
          statBlock(fmtPct(d.recommendationFunnel.replyRate), "Reply Rate"),
          statBlock(fmtPct(d.recommendationFunnel.sustainedConversationRate), "Sustained Conversation Rate")
        )}
      </div>
      <div class="${CARD}">
        <h3 class="${CARD_TITLE}">Funnel by Experiment Variant (last 30 days)</h3>
        <div class="space-y-5">
          ${Object.entries(d.funnelByVariant || {}).map(([variant, f]) => `
            <div>
              <div class="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">${esc(variant)}</div>
              ${statsGrid(
                statBlock(f.impressions, "Impressions"),
                statBlock(fmtPct(f.likeRate), "Like Rate"),
                statBlock(fmtPct(f.passRate), "Pass Rate"),
                statBlock(fmtPct(f.matchRate), "Match Rate"),
                statBlock(fmtPct(f.replyRate), "Reply Rate")
              )}
            </div>
          `).join("") || `<p class="text-sm text-gray-400">No data yet</p>`}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = errorCard(err.message);
  }
}
