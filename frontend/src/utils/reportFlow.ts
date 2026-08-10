import { showActionSheet } from "@/src/components/GlobalActionSheet";
import { ReportReason } from "@/services/reportService";

const REPORT_REASONS: { label: string; value: ReportReason }[] = [
  { label: "Inappropriate content", value: "inappropriate_content" },
  { label: "Fake profile", value: "fake_profile" },
  { label: "Harassment or abuse", value: "harassment" },
  { label: "Spam or scam", value: "spam" },
  { label: "Something else", value: "other" },
];

// Shared by ChatDetail and UserDetail's "..." menus so the reason list only
// lives in one place. Reporting also blocks the user on the backend.
export function showReportReasonPicker(
  userName: string,
  onSelect: (reason: ReportReason) => void,
) {
  showActionSheet({
    title: `Report ${userName}`,
    message: "Why are you reporting this user? This will also block them.",
    options: REPORT_REASONS.map((r) => ({
      label: r.label,
      destructive: true,
      onPress: () => onSelect(r.value),
    })),
  });
}
