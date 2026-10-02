import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { BlogEditor } from "@/components/BlogEditor";
import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "@/data/blogPosts";
import { subscribeToBlogPost, updateBlogPost } from "@/data/blogStore";

export default function EditBlogPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userData } = useAuth();
  const isDevAdmin = __DEV__;
  const isAdmin = userData?.role === "admin" || isDevAdmin;
  const [existing, setExisting] = useState<BlogPost | undefined>(undefined);

  useEffect(() => {
    const id = params.id ?? "";
    if (!id) {
      setExisting(undefined);
      return;
    }

    const unsubscribe = subscribeToBlogPost(
      id,
      (post) => {
        setExisting(post);
      },
      (error) => {
        console.error("[Blog] Failed to subscribe to edit post", error);
      }
    );

    return unsubscribe;
  }, [params.id]);

  if (!isAdmin) {
    Alert.alert("Admin only");
    return null;
  }

  if (!existing) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.lockedTitle}>Post not found</Text>
        <Text style={styles.lockedText}>This post cannot be edited.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <BlogEditor
        mode="edit"
        autosaveKey={`blog:edit-draft:${existing.id}`}
        initialValues={{
          title: existing.title,
          summary: existing.excerpt,
          body: existing.content,
        }}
        onBack={() => router.back()}
        onSubmit={async (values) => {
          try {
            await updateBlogPost(existing.id, {
              title: values.title,
              summary: values.summary,
              body: values.body,
            });
            setTimeout(() => {
              router.back();
            }, 240);
          } catch (error) {
            console.error("[Blog] Failed to update post", error);
            Alert.alert("Unable to save", "Please try again.");
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
