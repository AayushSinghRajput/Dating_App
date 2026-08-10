import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Message } from "@/services/chatService";
import VoiceMessageBubble from "./VoiceMessageBubble";
import MediaMessageBubble from "./MediaMessageBubble";

export default function MessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  onRetry,
  onLongPress,
}: {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onRetry: (message: Message) => void;
  onLongPress?: (message: Message) => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.messageContainer,
        message.fromMe ? styles.myMessageContainer : styles.theirMessageContainer,
        { marginTop: isFirstInGroup ? 10 : 2 },
      ]}
    >
      <Pressable
        onPress={() => message.failed && onRetry(message)}
        onLongPress={() => !message.deleted && !message.failed && onLongPress?.(message)}
        style={[
          styles.messageBubble,
          message.fromMe
            ? [
                styles.myMessage,
                { backgroundColor: colors.accent },
                isLastInGroup ? styles.myMessageTail : styles.myMessageGrouped,
              ]
            : [
                styles.theirMessage,
                { backgroundColor: colors.surfaceAlt },
                isLastInGroup ? styles.theirMessageTail : styles.theirMessageGrouped,
              ],
          (message.type === "image" || message.type === "video") &&
            !message.deleted &&
            styles.mediaBubble,
          message.failed && { borderColor: colors.accent, borderWidth: 1 },
        ]}
      >
        {message.deleted ? (
          <Text
            style={[
              styles.deletedText,
              { color: message.fromMe ? "#ffe5e7" : colors.textTertiary },
            ]}
          >
            🚫 This message was deleted
          </Text>
        ) : message.type === "audio" && message.audio ? (
          <VoiceMessageBubble
            uri={message.audio.url}
            duration={message.audio.duration}
            isMine={message.fromMe}
          />
        ) : (message.type === "image" || message.type === "video") && message.media ? (
          <MediaMessageBubble url={message.media.url} type={message.type} />
        ) : (
          <Text
            style={[
              message.fromMe ? styles.myMessageText : styles.theirMessageText,
              !message.fromMe && { color: colors.text },
            ]}
          >
            {message.text}
          </Text>
        )}
        <Text
          style={[
            styles.timestamp,
            message.fromMe
              ? styles.myTimestamp
              : [styles.theirTimestamp, { color: colors.textSecondary }],
            message.failed && { color: colors.accent },
          ]}
        >
          {message.timestamp} {message.failed ? "(Failed)" : ""}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  myMessageContainer: { justifyContent: "flex-end" },
  theirMessageContainer: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "75%", borderRadius: 16, padding: 10 },
  mediaBubble: { padding: 4 },
  myMessage: { alignSelf: "flex-end" },
  theirMessage: { alignSelf: "flex-start" },
  myMessageGrouped: { borderBottomRightRadius: 16 },
  myMessageTail: { borderBottomRightRadius: 4 },
  theirMessageGrouped: { borderBottomLeftRadius: 16 },
  theirMessageTail: { borderBottomLeftRadius: 4 },
  myMessageText: { color: "#fff" },
  theirMessageText: {},
  deletedText: { fontStyle: "italic", fontSize: 13 },
  timestamp: { fontSize: 10, marginTop: 4 },
  myTimestamp: { color: "#ffd9dc", textAlign: "right" },
  theirTimestamp: { textAlign: "left" },
});
