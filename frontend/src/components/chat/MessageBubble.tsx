import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Message } from "@/utils/api";
import VoiceMessageBubble from "./VoiceMessageBubble";

export default function MessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  onRetry,
}: {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onRetry: (message: Message) => void;
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
          message.failed && { borderColor: colors.accent, borderWidth: 1 },
        ]}
      >
        {message.type === "audio" && message.audio ? (
          <VoiceMessageBubble
            uri={message.audio.url}
            duration={message.audio.duration}
            isMine={message.fromMe}
          />
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
  myMessage: { alignSelf: "flex-end" },
  theirMessage: { alignSelf: "flex-start" },
  myMessageGrouped: { borderBottomRightRadius: 16 },
  myMessageTail: { borderBottomRightRadius: 4 },
  theirMessageGrouped: { borderBottomLeftRadius: 16 },
  theirMessageTail: { borderBottomLeftRadius: 4 },
  myMessageText: { color: "#fff" },
  theirMessageText: {},
  timestamp: { fontSize: 10, marginTop: 4 },
  myTimestamp: { color: "#ffd9dc", textAlign: "right" },
  theirTimestamp: { textAlign: "left" },
});
