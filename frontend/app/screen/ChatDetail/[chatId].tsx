import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import { Message, getMessagesByChatId, sendMessageApi } from "@/utils/api";
import {
  socket,
  connectSocket,
  joinRoom,
  sendMessage as socketSendMessage,
} from "@/utils/socket";
import { useCall } from "@/contexts/CallContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function ChatDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { chatId, name, avatar, otherUserId } = params as {
    chatId: string;
    name: string;
    avatar: string;
    otherUserId: string;
  };
  const { startCall } = useCall();
  const { colors } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messagesData = await getMessagesByChatId(chatId);
        setMessages(messagesData);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [chatId]);

  // Socket setup
  useEffect(() => {
    connectSocket();
    joinRoom(chatId);

    socket.on("newMessage", (message: Message) => {
      setMessages((prev) => {
        const allMessages = [message, ...prev];
        return allMessages.filter(
          (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
        );
      });
    });

    socket.on("messagesRead", ({ chatId: readChatId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat === readChatId && msg.sender?._id !== userId
            ? { ...msg, read: true }
            : msg
        )
      );
    });

    return () => {
      socket.off("newMessage");
      socket.off("messagesRead");
    };
  }, [chatId]);

  const handleBack = () => router.back();

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMessage: Message = {
      id: tempId,
      text: input,
      fromMe: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderName: "You",
      senderAvatar: "", // temporary empty
      failed: false,
    };

    // Optimistically add message
    setMessages((prev) => [newMessage, ...prev]);
    setInput("");

    try {
      const savedMessage = await sendMessageApi(chatId, newMessage.text);
      if (!savedMessage) throw new Error("No response from server");

      // Send via socket
      socketSendMessage(chatId, {
        chatId,
        senderId: savedMessage.sender._id,
        text: savedMessage.text,
      });

      // Replace temp message with saved message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                id: savedMessage._id,
                text: savedMessage.text,
                fromMe: true,
                timestamp: new Date(savedMessage.createdAt).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                senderName: savedMessage.sender.username,
                senderAvatar: savedMessage.sender.profileImage || "",
                failed: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, failed: true } : msg))
      );
    }
  };

  const retrySendMessage = async (failedMessage: Message) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === failedMessage.id
          ? { ...msg, failed: false, retrying: true }
          : msg
      )
    );

    try {
      const savedMessage = await sendMessageApi(chatId, failedMessage.text);
      if (!savedMessage) throw new Error("No response from server");

      socketSendMessage(chatId, {
        chatId,
        senderId: savedMessage.sender._id,
        text: savedMessage.text,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? {
                id: savedMessage._id,
                text: savedMessage.text,
                fromMe: true,
                timestamp: new Date(savedMessage.createdAt).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                senderName: savedMessage.sender.username,
                senderAvatar: savedMessage.sender.profileImage || "",
                failed: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Retry failed:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? { ...msg, failed: true, retrying: false }
            : msg
        )
      );
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.fromMe ? styles.myMessageContainer : styles.theirMessageContainer,
      ]}
    >
      <Image
        source={{
          uri: item.senderAvatar || "https://placehold.co/100x100",
        }}
        style={styles.avatar}
      />

      <Pressable
        onPress={() => item.failed && retrySendMessage(item)}
        style={[
          styles.messageBubble,
          item.fromMe
            ? [styles.myMessage, { backgroundColor: colors.accent }]
            : [styles.theirMessage, { backgroundColor: colors.surfaceAlt }],
          item.failed && { borderColor: colors.accent, borderWidth: 1 },
        ]}
      >
        <Text
          style={[
            item.fromMe ? styles.myMessageText : styles.theirMessageText,
            !item.fromMe && { color: colors.text },
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.fromMe ? styles.myTimestamp : [styles.theirTimestamp, { color: colors.textSecondary }],
            item.failed && { color: colors.accent },
          ]}
        >
          {item.timestamp} {item.failed ? "(Failed)" : ""}
        </Text>
      </Pressable>
    </View>
  );

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.profileSection}>
            <Image source={{ uri: avatar }} style={styles.profileImage} />
            <Text style={[styles.profileName, { color: colors.text }]}>{name}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.iconButton}
              onPress={() => startCall(otherUserId, chatId, "audio", name, avatar)}
            >
              <Ionicons name="call-outline" size={22} color={colors.accent} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => startCall(otherUserId, chatId, "video", name, avatar)}
            >
              <Ionicons name="videocam-outline" size={22} color={colors.accent} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
          inverted
          showsVerticalScrollIndicator={false}
        />

        {/* Input + Emoji */}
        <View style={[styles.inputRow, { borderColor: colors.border }]}>
          <Pressable onPress={toggleEmojiPicker} style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={28} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: colors.accent },
              !input.trim() && { backgroundColor: colors.textTertiary },
            ]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={input.trim() ? "#fff" : colors.textTertiary}
            />
          </Pressable>
        </View>

        {showEmojiPicker && (
          <EmojiSelector
            onEmojiSelected={(emoji) => setInput((prev) => prev + emoji)}
            showSearchBar={false}
            showTabs
            columns={8}
            showHistory
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 10 },
  backButton: { padding: 4 },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  profileName: { fontSize: 18, fontWeight: "600" },
  headerIcons: { flexDirection: "row", gap: 12 },
  iconButton: { padding: 4 },
  messagesContainer: { paddingHorizontal: 12, paddingBottom: 10 },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  myMessageContainer: { justifyContent: "flex-end" },
  theirMessageContainer: { justifyContent: "flex-start" },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 6 },
  messageBubble: { maxWidth: "75%", borderRadius: 16, padding: 10 },
  myMessage: { alignSelf: "flex-end" },
  theirMessage: { alignSelf: "flex-start" },
  myMessageText: { color: "#fff" },
  theirMessageText: {},
  timestamp: { fontSize: 10, marginTop: 4 },
  myTimestamp: { color: "#ffd9dc", textAlign: "right" },
  theirTimestamp: { textAlign: "left" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
  },
  emojiButton: { padding: 4, marginRight: 4 },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 6,
    borderRadius: 20,
    padding: 10,
  },
});
