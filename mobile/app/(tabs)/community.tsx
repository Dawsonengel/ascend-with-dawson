import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";

import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/context/MembershipContext";
import { db } from "@/firebaseConfig";
import {
  Timestamp,
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

let BlurView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BlurView = require("expo-blur").BlurView;
} catch {
  BlurView = null;
}

type ChatMessage = {
  id: string;
  text: string;
  createdAt: Date | null;
  userId: string;
  username: string;
  pending?: boolean;
};

export default function CommunityScreen() {
  const router = useRouter();
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, resolvedScheme), [colors, resolvedScheme]);
  const { user, userData } = useAuth();
  const { hasPremiumAccess } = useMembership();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  const username =
    typeof userData?.publicUsername === "string" && userData.publicUsername.trim()
      ? userData.publicUsername.trim()
      : "Member";
  const currentUserId = user?.uid ?? "";
  const hasCommunityAccess = hasPremiumAccess;

  useEffect(() => {
    const onlineUsersQuery = query(collection(db, "users"), where("isOnline", "==", true));

    const unsubscribe = onSnapshot(onlineUsersQuery, (snapshot) => {
      setOnlineCount(snapshot.size);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, "communityMessages"),
      orderBy("createdAt", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const next = snapshot.docs.map((docItem) => {
        const data = docItem.data() as {
          text?: string;
          createdAt?: Timestamp;
          userId?: string;
          username?: string;
        };

        return {
          id: docItem.id,
          text: data.text ?? "",
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
          userId: data.userId ?? "",
          username: data.username ?? "Member",
          pending: docItem.metadata.hasPendingWrites,
        };
      });

      setMessages(next);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    });

    return unsubscribe;
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) {
      return "now";
    }
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) {
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      text,
      createdAt: new Date(),
      userId: currentUserId,
      username,
      pending: true,
    };

    setInput("");
    setMessages((prev) => [optimisticMessage, ...prev]);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });

    try {
      setIsSending(true);
      await addDoc(collection(db, "communityMessages"), {
        text,
        createdAt: serverTimestamp(),
        userId: currentUserId,
        username,
      });
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setInput(text);
      console.error("[Community] Failed to send message", error);
      Alert.alert("Message failed", "Could not send. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ascend Community</Text>
        <Text style={styles.subtitle}>Members Online ({onlineCount})</Text>
      </View>

      <View style={styles.chatArea}>
          <FlatList
            ref={listRef}
            data={messages}
            inverted
            scrollEnabled={hasCommunityAccess}
            pointerEvents={hasCommunityAccess ? "auto" : "none"}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={[styles.messagesList, !hasCommunityAccess && styles.previewList]}
            renderItem={({ item }) => {
              const isCurrentUser = item.userId === currentUserId;

              return (
                <View style={[styles.messageRow, isCurrentUser ? styles.rowRight : styles.rowLeft]}>
                  <View
                    style={[
                      styles.bubble,
                      isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
                      item.pending && styles.pendingBubble,
                    ]}
                  >
                    {!isCurrentUser ? (
                      <Text style={[styles.username, !hasCommunityAccess && styles.gatedMetaText]}>
                        {item.username}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.messageText,
                        isCurrentUser && styles.messageTextRight,
                        !hasCommunityAccess && styles.gatedMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text
                      style={[
                        styles.timestamp,
                        isCurrentUser && styles.timestampRight,
                        !hasCommunityAccess && styles.gatedMetaText,
                      ]}
                    >
                      {item.pending ? "sending..." : formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>No messages yet. Start the conversation.</Text>}
          />

          {hasCommunityAccess ? (
            <View style={styles.inputWrap}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Message..."
                placeholderTextColor={colors.subtleText}
                style={styles.input}
                multiline
                maxLength={300}
              />
              <Pressable
                onPress={handleSend}
                disabled={isSending || !input.trim()}
                style={({ pressed }) => [
                  styles.sendButton,
                  (pressed || isSending || !input.trim()) && styles.sendButtonDisabled,
                ]}
              >
                <Text style={styles.sendButtonText}>{isSending ? "..." : "Send"}</Text>
              </Pressable>
            </View>
          ) : null}

          {!hasCommunityAccess ? (
            <View style={styles.previewOverlay}>
              {BlurView ? (
                <BlurView intensity={88} tint="dark" style={StyleSheet.absoluteFill} />
              ) : null}
              <View style={styles.previewGradient} />
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Private Community</Text>
                <Text style={styles.previewText}>Community is reserved for committed members.</Text>
                <Pressable style={styles.previewButton} onPress={() => router.push("/store")}>
                  <Text style={styles.previewButtonText}>Unlock Access</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: {
    background: string;
    card: string;
    border: string;
    text: string;
    subtleText: string;
    primaryButton: string;
    primaryButtonText: string;
  },
  resolvedScheme: "light" | "dark"
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 76,
      paddingHorizontal: 16,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "800",
    },
    header: {
      paddingHorizontal: 4,
      marginBottom: 10,
      backgroundColor: "transparent",
    },
    subtitle: {
      color: colors.subtleText,
      fontSize: 12,
      marginTop: 2,
    },
    chatArea: {
      flex: 1,
      position: "relative",
      backgroundColor: colors.background,
    },
    messagesList: {
      backgroundColor: colors.background,
    },
    messagesContent: {
      paddingHorizontal: 4,
      paddingBottom: 12,
      gap: 8,
    },
    previewList: {
      opacity: 0.46,
    },
    messageRow: {
      width: "100%",
      marginBottom: 8,
    },
    rowLeft: {
      alignItems: "flex-start",
    },
    rowRight: {
      alignItems: "flex-end",
    },
    bubble: {
      maxWidth: "82%",
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    bubbleLeft: {
      backgroundColor: resolvedScheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.07)",
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleRight: {
      backgroundColor: colors.primaryButton,
      borderBottomRightRadius: 6,
    },
    pendingBubble: {
      opacity: 0.6,
    },
    username: {
      color: colors.subtleText,
      fontSize: 11,
      fontWeight: "600",
      marginBottom: 3,
    },
    messageText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
    },
    messageTextRight: {
      color: colors.primaryButtonText,
    },
    timestamp: {
      marginTop: 4,
      color: colors.subtleText,
      fontSize: 11,
      alignSelf: "flex-start",
    },
    timestampRight: {
      color: resolvedScheme === "dark" ? "rgba(14,14,14,0.62)" : "rgba(248,250,252,0.62)",
      alignSelf: "flex-end",
    },
    gatedMessageText: {
      opacity: 0.56,
    },
    gatedMetaText: {
      opacity: 0.5,
    },
    empty: {
      color: colors.subtleText,
      textAlign: "center",
      marginTop: 20,
      fontSize: 14,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 20 : 10,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 110,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: resolvedScheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)",
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
    },
    sendButton: {
      height: 42,
      borderRadius: 14,
      paddingHorizontal: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primaryButton,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    sendButtonText: {
      color: colors.primaryButtonText,
      fontSize: 14,
      fontWeight: "700",
    },
    previewOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: resolvedScheme === "dark" ? "rgba(8,12,18,0.26)" : "rgba(15,23,42,0.18)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    previewGradient: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: resolvedScheme === "dark" ? "rgba(8,12,18,0.16)" : "rgba(15,23,42,0.1)",
      ...(Platform.OS === "web"
        ? ({
            background:
              resolvedScheme === "dark"
                ? "linear-gradient(180deg, rgba(8,12,18,0.02) 0%, rgba(8,12,18,0.12) 45%, rgba(8,12,18,0.24) 100%)"
                : "linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(15,23,42,0.08) 45%, rgba(15,23,42,0.18) 100%)",
          } as never)
        : {}),
    },
    previewCard: {
      width: "100%",
      maxWidth: 320,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 18,
      paddingVertical: 16,
      alignItems: "center",
      gap: 8,
    },
    previewTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
    },
    previewText: {
      color: colors.subtleText,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    previewButton: {
      marginTop: 4,
      backgroundColor: colors.primaryButton,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    previewButtonText: {
      color: colors.primaryButtonText,
      fontSize: 14,
      fontWeight: "700",
    },
  });
