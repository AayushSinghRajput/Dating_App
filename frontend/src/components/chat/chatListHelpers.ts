import { Message } from "@/services/chatService";

export type ListItem =
  | {
      type: "message";
      key: string;
      message: Message;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    }
  | { type: "separator"; key: string; label: string };

export function dayKey(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatDateLabel(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatClockTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Messages from the same sender within this window are visually grouped together.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function buildListData(messages: Message[]): ListItem[] {
  // messages is newest-first (index 0 = most recent), matching the inverted FlatList's expectations.
  const result: ListItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const older = messages[i + 1]; // chronologically before msg
    const newer = messages[i - 1]; // chronologically after msg
    const isText = (m?: Message) => !!m && (m.type || "text") === "text";
    const sameSender = (a?: Message, b?: Message) =>
      isText(a) && isText(b) && a!.fromMe === b!.fromMe;
    const closeInTime = (a?: Message, b?: Message) => {
      if (!a?.createdAt || !b?.createdAt) return false;
      return (
        Math.abs(
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ) < GROUP_WINDOW_MS
      );
    };

    const isFirstInGroup =
      !older ||
      dayKey(older.createdAt) !== dayKey(msg.createdAt) ||
      !sameSender(older, msg) ||
      !closeInTime(older, msg);
    const isLastInGroup =
      !newer ||
      dayKey(newer.createdAt) !== dayKey(msg.createdAt) ||
      !sameSender(newer, msg) ||
      !closeInTime(newer, msg);

    result.push({
      type: "message",
      key: msg.id,
      message: msg,
      isFirstInGroup,
      isLastInGroup,
    });

    if (!older || dayKey(older.createdAt) !== dayKey(msg.createdAt)) {
      result.push({
        type: "separator",
        key: `sep-${dayKey(msg.createdAt)}`,
        label: formatDateLabel(msg.createdAt),
      });
    }
  }
  return result;
}
