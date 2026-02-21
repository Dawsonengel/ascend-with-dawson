import { useEffect, useRef, useState } from "react";
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
import { useRouter } from "expo-router";

import { theme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

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
  const { user } = useAuth();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [role, setRole] = useState<string | null>(null);

  const username = user?.displayName?.trim() || user?.email?.split("@")[0] || "Member";
  const currentUserId = user?.uid ?? "";
  const isMember = role === "member";

  useEffect(() => {
    if (!currentUserId) {
      setRole(null);
      return;
    }

    let isActive = true;

    getDoc(doc(db, "users", currentUserId))
      .then((snap) => {
        if (!isActive) {
          return;
        }
        const nextRole = snap.exists() ? (snap.data().role as string | undefined) : null;
        setRole(nextRole ?? null);
      })
      .catch((error) => {
        console.error("[Community] Failed to fetch user role", error);
        if (isActive) {
          setRole(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUserId]);

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
        <Text style={styles.subtitle}>Members online</Text>
      </View>

      <View style={styles.chatArea}>
          <FlatList
            ref={listRef}
            data={messages}
            inverted
            scrollEnabled={isMember}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
                    {!isCurrentUser ? <Text style={styles.username}>{item.username}</Text> : null}
                    <Text style={[styles.messageText, isCurrentUser && styles.messageTextRight]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.timestamp, isCurrentUser && styles.timestampRight]}>
                      {item.pending ? "sending..." : formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>No messages yet. Start the conversation.</Text>}
          />

          {isMember ? (
            <View style={styles.inputWrap}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Message..."
                placeholderTextColor={theme.colors.subtleText}
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

          {!isMember ? (
            <View style={styles.previewOverlay}>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Private Community</Text>
                <Text style={styles.previewText}>Join the movement to participate.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 76,
    paddingHorizontal: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  header: {
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  subtitle: {
    color: theme.colors.subtleText,
    fontSize: 12,
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
    position: "relative",
  },
  messagesContent: {
    paddingHorizontal: 4,
    paddingBottom: 12,
    gap: 8,
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleRight: {
    backgroundColor: "#f5f5f5",
    borderBottomRightRadius: 6,
  },
  pendingBubble: {
    opacity: 0.6,
  },
  username: {
    color: theme.colors.subtleText,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },
  messageText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextRight: {
    color: "#0e0e0e",
  },
  timestamp: {
    marginTop: 4,
    color: theme.colors.subtleText,
    fontSize: 11,
    alignSelf: "flex-start",
  },
  timestampRight: {
    color: "rgba(14,14,14,0.62)",
    alignSelf: "flex-end",
  },
  empty: {
    color: theme.colors.subtleText,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: theme.colors.text,
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
    backgroundColor: theme.colors.primaryButton,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: theme.colors.primaryButtonText,
    fontSize: 14,
    fontWeight: "700",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  previewCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  previewText: {
    color: theme.colors.subtleText,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  previewButton: {
    marginTop: 4,
    backgroundColor: theme.colors.primaryButton,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  previewButtonText: {
    color: theme.colors.primaryButtonText,
    fontSize: 14,
    fontWeight: "700",
  },
});
