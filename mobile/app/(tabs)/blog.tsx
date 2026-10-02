import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "@/data/blogPosts";
import { subscribeToBlogPosts } from "@/data/blogStore";

const ADMIN_EMAIL = "de8685@hotmail.com";

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function estimateReadMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export default function BlogTabScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const canCreatePosts = user?.email?.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = subscribeToBlogPosts(
      (nextPosts) => {
        setPosts(nextPosts);
      },
      (error) => {
        console.error("[Blog] Failed to subscribe to posts", error);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guidance</Text>
      <Text style={styles.subtitle}>Direction for building stability.</Text>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {canCreatePosts ? (
          <Pressable onPress={() => router.push("/blog/new")} style={styles.newPostButton}>
            <Text style={styles.newPostText}>New Post</Text>
          </Pressable>
        ) : null}

        {posts.map((post, index) => (
          <Pressable key={post.id} onPress={() => router.push(`/blog/${post.id}`)} style={styles.postRow}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.postSummary}>
              {post.excerpt}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
              <Text style={styles.metaText}>·</Text>
              <Text style={styles.metaText}>{estimateReadMinutes(post.content)} min read</Text>
            </View>
            {index < posts.length - 1 ? <View style={styles.divider} /> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: {
  background: string;
  border: string;
  text: string;
  mutedText: string;
  subtleText: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 74,
      paddingHorizontal: 22,
    },
    title: {
      color: colors.text,
      fontSize: 38,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    subtitle: {
      color: colors.subtleText,
      fontSize: 14,
      marginTop: 8,
      marginBottom: 16,
    },
    listContent: {
      paddingBottom: 28,
    },
    newPostButton: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    newPostText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    postRow: {
      paddingVertical: 18,
    },
    postTitle: {
      color: colors.text,
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    postSummary: {
      color: colors.mutedText,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 8,
      maxWidth: 560,
    },
    metaRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      color: colors.subtleText,
      fontSize: 12,
    },
    divider: {
      marginTop: 18,
      height: 1,
      backgroundColor: colors.border,
    },
  });
