import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Alert,
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
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import {
  Message,
  getMessagesByChatId,
  sendMessageApi,
  sendVoiceMessageApi,
  sendMediaMessageApi,
  deleteMessageApi,
  getCurrentUserId,
  unmatchUser,
  blockUserApi,
  reportUserApi,
} from "@/utils/api";
import { showReportReasonPicker } from "@/src/utils/reportFlow";
import { showActionSheet } from "@/src/components/GlobalActionSheet";
import { shareMyLocation } from "@/src/utils/safety";
import { socket, connectSocket, joinRoom, emitTyping, emitStopTyping } from "@/utils/socket";
import { useCall } from "@/contexts/CallContext";
import { useTheme } from "@/contexts/ThemeContext";
import { buildListData, formatClockTime } from "../../../src/components/chat/chatListHelpers";
import MessageBubble from "../../../src/components/chat/MessageBubble";
import CallLogRow from "../../../src/components/chat/CallLogRow";
import DateSeparator from "../../../src/components/chat/DateSeparator";
import { useVoiceRecorder } from "../../../src/hooks/useVoiceRecorder";

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
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch messages (backend returns oldest-first; reverse to newest-first for the inverted list)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const [messagesData, userId] = await Promise.all([
          getMessagesByChatId(chatId),
          getCurrentUserId(),
        ]);
        currentUserIdRef.current = userId;
        setMessages(messagesData.slice().reverse());
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

    const handleNewMessage = (raw: any) => {
      const normalized: Message = {
        id: raw.id || raw._id,
        text: raw.text,
        fromMe: raw.sender?._id === currentUserIdRef.current,
        createdAt: raw.createdAt,
        timestamp: new Date(raw.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: raw.sender?.username,
        senderAvatar: raw.sender?.profileImage || "",
        chat: raw.chat,
        type: raw.type || "text",
        call: raw.call,
        audio: raw.audio,
        media: raw.media,
      };
      setMessages((prev) => {
        const allMessages = [normalized, ...prev];
        return allMessages.filter(
          (msg, index, self) =>
            index === self.findIndex((m) => m.id === msg.id),
        );
      });
    };

    socket.on("newMessage", handleNewMessage);

    socket.on("messagesRead", ({ chatId: readChatId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat === readChatId && msg.sender?._id !== userId
            ? { ...msg, read: true }
            : msg,
        ),
      );
    });

    const handleUnmatched = ({ byUserId }: { byUserId: string }) => {
      if (byUserId !== otherUserId) return;
      Toast.show({ type: "info", text1: `${name || "This user"} unmatched with you` });
      router.back();
    };
    socket.on("unmatched", handleUnmatched);

    const handleUserTyping = ({ chatId: tChatId, userId }: { chatId: string; userId: string }) => {
      if (tChatId === chatId && userId === otherUserId) setIsOtherTyping(true);
    };
    const handleUserStoppedTyping = ({ chatId: tChatId, userId }: { chatId: string; userId: string }) => {
      if (tChatId === chatId && userId === otherUserId) setIsOtherTyping(false);
    };
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    const handleMessageDeleted = ({
      messageId,
      mode,
    }: {
      messageId: string;
      mode: "me" | "everyone";
    }) => {
      if (mode === "everyone") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, deleted: true, text: "", media: undefined, audio: undefined }
              : msg,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }
    };
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead");
      socket.off("unmatched", handleUnmatched);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitStopTyping(chatId);
    };
  }, [chatId]);

  const handleBack = () => router.back();

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch",
      `Unmatch with ${name || "this user"}? This deletes your conversation and can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              await unmatchUser(otherUserId);
              router.back();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Failed to unmatch",
                text2: error.message,
              });
            }
          },
        },
      ],
    );
  };

  const handleBlock = () => {
    Alert.alert(
      "Block User",
      `Block ${name || "this user"}? They won't be able to see your profile, message you, or call you. Your conversation will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUserApi(otherUserId);
              router.back();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Failed to block user",
                text2: error.message,
              });
            }
          },
        },
      ],
    );
  };

  const handleReport = () => {
    showReportReasonPicker(name || "this user", async (reason) => {
      try {
        await reportUserApi(otherUserId, reason);
        Toast.show({ type: "success", text1: "Report submitted" });
        router.back();
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Failed to submit report", text2: error.message });
      }
    });
  };

  const handleShareLocation = async () => {
    try {
      await shareMyLocation();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't share location", text2: error.message });
    }
  };

  const handleChatOptions = () => {
    showActionSheet({
      title: name || "Chat options",
      options: [
        { label: "Share My Location", onPress: handleShareLocation },
        { label: "Report", destructive: true, onPress: handleReport },
        { label: "Block", destructive: true, onPress: handleBlock },
        { label: "Unmatch", destructive: true, onPress: handleUnmatch },
      ],
    });
  };

  const runDeleteMessage = async (message: Message, mode: "me" | "everyone") => {
    const previous = messages;
    if (mode === "everyone") {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? { ...msg, deleted: true, text: "", media: undefined, audio: undefined }
            : msg,
        ),
      );
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    }

    try {
      await deleteMessageApi(message.id, mode);
    } catch (error: any) {
      setMessages(previous);
      Toast.show({ type: "error", text1: "Failed to delete message", text2: error.message });
    }
  };

  const handleLongPressMessage = (message: Message) => {
    const options = message.fromMe
      ? [
          { label: "Delete for me", destructive: true, onPress: () => runDeleteMessage(message, "me") },
          {
            label: "Delete for everyone",
            destructive: true,
            onPress: () => runDeleteMessage(message, "everyone"),
          },
        ]
      : [
          { label: "Delete for me", destructive: true, onPress: () => runDeleteMessage(message, "me") },
        ];

    showActionSheet({ title: "Message options", options });
  };

  const handleInputChange = (text: string) => {
    setInput(text);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (text.trim()) {
      emitTyping(chatId);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(chatId);
      }, 2000);
    } else {
      emitStopTyping(chatId);
    }
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
  };

  // Confirms an optimistically-sent message with its real server id, and
  // also removes any entry already present under that real id — the socket
  // broadcast for this same message can arrive before this REST/upload
  // response does (routine for voice messages, since the upload itself
  // takes longer than the socket round-trip), so without this both copies
  // would survive and collide on the same React key.
  const confirmMessage = (tempId: string, confirmed: Message) => {
    setMessages((prev) => {
      const withoutStaleEntries = prev.filter(
        (msg) => msg.id !== tempId && msg.id !== confirmed.id,
      );
      return [confirmed, ...withoutStaleEntries];
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitStopTyping(chatId);

    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMessage: Message = {
      id: tempId,
      text: input,
      fromMe: true,
      createdAt: new Date().toISOString(),
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

      // Replace temp message with saved message (the server also broadcasts this
      // over the socket to the other participant; our own copy is deduped by id)
      confirmMessage(tempId, {
        id: savedMessage._id,
        text: savedMessage.text,
        fromMe: true,
        createdAt: savedMessage.createdAt,
        timestamp: new Date(savedMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: savedMessage.sender.username,
        senderAvatar: savedMessage.sender.profileImage || "",
        failed: false,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, failed: true } : msg)),
      );
    }
  };

  const retrySendMessage = async (failedMessage: Message) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === failedMessage.id
          ? { ...msg, failed: false, retrying: true }
          : msg,
      ),
    );

    try {
      const isVoice = failedMessage.type === "audio" && failedMessage.audio;
      const savedMessage = isVoice
        ? await sendVoiceMessageApi(
            chatId,
            failedMessage.audio!.url,
            failedMessage.audio!.duration,
          )
        : await sendMessageApi(chatId, failedMessage.text);
      if (!savedMessage) throw new Error("No response from server");

      confirmMessage(failedMessage.id, {
        id: savedMessage._id,
        text: savedMessage.text || "",
        fromMe: true,
        type: isVoice ? "audio" : "text",
        audio: isVoice ? savedMessage.audio : undefined,
        createdAt: savedMessage.createdAt,
        timestamp: new Date(savedMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: savedMessage.sender.username,
        senderAvatar: savedMessage.sender.profileImage || "",
        failed: false,
      });
    } catch (error) {
      console.error("Retry failed:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? { ...msg, failed: true, retrying: false }
            : msg,
        ),
      );
    }
  };

  const handleRecordingComplete = async (uri: string, durationSec: number) => {
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optimistic: Message = {
      id: tempId,
      text: "",
      fromMe: true,
      type: "audio",
      audio: { url: uri, duration: durationSec },
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderName: "You",
      failed: false,
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      const saved = await sendVoiceMessageApi(chatId, uri, durationSec);
      confirmMessage(tempId, {
        id: saved._id,
        text: "",
        fromMe: true,
        type: "audio",
        audio: saved.audio,
        createdAt: saved.createdAt,
        timestamp: new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: saved.sender?.username,
        senderAvatar: saved.sender?.profileImage || "",
        failed: false,
      });
    } catch (err) {
      console.error("Failed to send voice message:", err);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, failed: true } : msg)),
      );
    }
  };

  const handleMediaSelected = async (
    uri: string,
    mediaType: "image" | "video",
    mimeType: string,
  ) => {
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optimistic: Message = {
      id: tempId,
      text: "",
      fromMe: true,
      type: mediaType,
      media: { url: uri },
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderName: "You",
      failed: false,
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      const saved = await sendMediaMessageApi(chatId, uri, mimeType);
      confirmMessage(tempId, {
        id: saved._id,
        text: "",
        fromMe: true,
        type: saved.type,
        media: saved.media,
        createdAt: saved.createdAt,
        timestamp: new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderName: saved.sender?.username,
        senderAvatar: saved.sender?.profileImage || "",
        failed: false,
      });
    } catch (err) {
      console.error("Failed to send media message:", err);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, failed: true } : msg)),
      );
    }
  };

  const handlePickMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow photo & video access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mediaType: "image" | "video" = asset.type === "video" ? "video" : "image";
    const mimeType = asset.mimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg");
    handleMediaSelected(asset.uri, mediaType, mimeType);
  };

  const { isRecording, isCancelling, durationMillis, micResponderHandlers } =
    useVoiceRecorder(handleRecordingComplete);

  const listData = useMemo(() => buildListData(messages), [messages]);

  const renderItem = ({ item }: { item: ReturnType<typeof buildListData>[number] }) => {
    if (item.type === "separator") {
      return <DateSeparator label={item.label} />;
    }
    if (item.message.type === "call") {
      return <CallLogRow message={item.message} />;
    }
    return (
      <MessageBubble
        message={item.message}
        isFirstInGroup={item.isFirstInGroup}
        isLastInGroup={item.isLastInGroup}
        onRetry={retrySendMessage}
        onLongPress={handleLongPressMessage}
      />
    );
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <Text
                style={[styles.profileName, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {name}
              </Text>
              {isOtherTyping && (
                <Text style={[styles.typingIndicator, { color: colors.accent }]}>
                  typing...
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                startCall(otherUserId, chatId, "audio", name, avatar)
              }
            >
              <Ionicons name="call-outline" size={22} color={colors.accent} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                startCall(otherUserId, chatId, "video", name, avatar)
              }
            >
              <Ionicons
                name="videocam-outline"
                size={22}
                color={colors.accent}
              />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={handleChatOptions}>
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
          inverted
          showsVerticalScrollIndicator={false}
        />

        {/* Input + Emoji */}
        <View style={[styles.inputRow, { borderColor: colors.border }]}>
          {isRecording ? (
            <View style={styles.recordingBar}>
              <View style={styles.recordingDot} />
              <Text style={[styles.recordingDuration, { color: colors.text }]}>
                {formatClockTime(durationMillis / 1000)}
              </Text>
              <Text
                style={[
                  styles.recordingHint,
                  { color: isCancelling ? "#e05252" : colors.textTertiary },
                ]}
              >
                {isCancelling ? "Release to cancel" : "‹ Slide to cancel"}
              </Text>
            </View>
          ) : (
            <>
              <Pressable onPress={toggleEmojiPicker} style={styles.emojiButton}>
                <Ionicons
                  name="happy-outline"
                  size={28}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable onPress={handlePickMedia} style={styles.emojiButton}>
                <Ionicons
                  name="image-outline"
                  size={26}
                  color={colors.textSecondary}
                />
              </Pressable>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.textTertiary}
                value={input}
                onChangeText={handleInputChange}
                multiline
              />
            </>
          )}

          {input.trim() ? (
            <Pressable
              style={[styles.sendButton, { backgroundColor: colors.accent }]}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          ) : (
            <View
              {...micResponderHandlers}
              style={[
                styles.sendButton,
                {
                  backgroundColor: isCancelling
                    ? "#e05252"
                    : isRecording
                      ? colors.accent
                      : colors.textTertiary,
                },
              ]}
            >
              <Ionicons name="mic" size={20} color="#fff" />
            </View>
          )}
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
    flexShrink: 1,
    minWidth: 0,
    gap: 10,
  },
  profileImage: { width: 40, height: 40, borderRadius: 20, flexShrink: 0 },
  profileName: { fontSize: 18, fontWeight: "600", flexShrink: 1 },
  typingIndicator: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  headerIcons: { flexDirection: "row", gap: 12, flexShrink: 0 },
  iconButton: { padding: 4 },
  messagesContainer: { paddingHorizontal: 12, paddingBottom: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
  },
  recordingBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e05252",
  },
  recordingDuration: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  recordingHint: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
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
