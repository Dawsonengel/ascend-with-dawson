import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { BlogEditor } from "@/components/BlogEditor";
import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { createBlogPost } from "@/data/blogStore";

const ADMIN_EMAIL = "de8685@hotmail.com";

export default function NewBlogPostScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const canCreatePosts = user?.email?.trim().toLowerCase() === ADMIN_EMAIL;

  if (!canCreatePosts) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.lockedTitle}>Admin only</Text>
        <Text style={styles.lockedText}>Only the admin account can create posts.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <BlogEditor
        mode="create"
        autosaveKey="blog:create-draft"
        initialValues={{ title: "", summary: "", body: "" }}
        onBack={() => router.back()}
        onSubmit={async (values) => {
          if (user?.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
            Alert.alert("Admin only", "Only the admin account can create posts.");
            throw new Error("Non-admin create attempt blocked");
          }

          try {
            const author = user?.displayName?.trim() || user?.email?.trim() || undefined;
            await createBlogPost({
              title: values.title,
              summary: values.summary,
              body: values.body,
              author,
            });
            setTimeout(() => {
              router.back();
            }, 240);
          } catch (error) {
            console.error("[Blog] Failed to publish post", error);
            Alert.alert("Unable to publish", "Please try again.");
            throw error;
          }
        }}
      />
    </View>
  );
}

const createStyles = (colors: { background: string; text: string; mutedText: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    lockedTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "700",
      paddingTop: 70,
      paddingHorizontal: 20,
    },
    lockedText: {
      marginTop: 10,
      color: colors.mutedText,
      fontSize: 15,
      lineHeight: 22,
      paddingHorizontal: 20,
    },
  });
