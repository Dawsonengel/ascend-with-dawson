import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "@/data/blogPosts";
import {
  deleteBlogPost,
  recordBlogPostCompletion,
  recordBlogPostView,
  subscribeToBlogPost,
} from "@/data/blogStore";

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

export default function BlogDetailScreen() {
  const router = useRouter();
  const { userData } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const maxCompletionRef = useRef(0);
  const hasTrackedViewRef = useRef(false);
  const isDevAdmin = __DEV__;
  const isAdmin = userData?.role === "admin" || isDevAdmin;

  const onDeletePost = () => {
    if (!post?.id) {
      return;
    }

    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteBlogPost(post.id)
            .then(() => {
              router.back();
            })
            .catch((error) => {
              console.error("[Blog] Failed to delete post", error);
              Alert.alert("Delete failed", "Could not delete this post.");
            });
        },
      },
    ]);
  };

  const openOptionsMenu = () => {
    if (!post?.id) {
      return;
    }

    Alert.alert("Post Options", undefined, [
      {
        text: "Edit Post",
        onPress: () => {
          router.push(`/blog/edit/${post.id}`);
        },
      },
      {
        text: "Delete Post",
        style: "destructive",
        onPress: onDeletePost,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  useEffect(() => {
    maxCompletionRef.current = 0;
    hasTrackedViewRef.current = false;
  }, [params.id]);

  useEffect(() => {
    const id = params.id ?? "";
    if (!id) {
      setPost(undefined);
      return;
    }

    const unsubscribe = subscribeToBlogPost(
      id,
      (nextPost) => {
        setPost(nextPost);
      },
      (error) => {
        console.error("[Blog] Failed to subscribe to post", error);
      }
    );

    return unsubscribe;
  }, [params.id]);

  useEffect(() => {
    const id = params.id ?? "";
    if (!id || hasTrackedViewRef.current) {
      return;
    }

    hasTrackedViewRef.current = true;
    const viewedKey = `viewed_post_${id}`;

    const trackView = async () => {
      try {
        let hasViewed = false;

        if (Platform.OS === "web" && typeof window !== "undefined") {
          hasViewed = window.localStorage.getItem(viewedKey) === "true";
        } else {
          hasViewed = (await AsyncStorage.getItem(viewedKey)) === "true";
        }

        await recordBlogPostView(id, !hasViewed);

        if (!hasViewed) {
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.localStorage.setItem(viewedKey, "true");
          } else {
            await AsyncStorage.setItem(viewedKey, "true");
          }
        }
      } catch (error) {
        console.error("[Blog] Failed to record view", error);
      }
    };

    void trackView();
  }, [params.id]);

  useEffect(() => {
    const id = params.id ?? "";

    return () => {
      if (!id || maxCompletionRef.current <= 0) {
        return;
      }

      recordBlogPostCompletion(id, maxCompletionRef.current).catch((error) => {
        console.error("[Blog] Failed to record completion", error);
      });
    };
  }, [params.id]);

  const paragraphs = useMemo(
    () => (post?.content ? post.content.split(/\n\s*\n/).filter(Boolean) : []),
    [post?.content]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        {isAdmin ? (
          <Pressable onPress={openOptionsMenu} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>•••</Text>
          </Pressable>
        ) : null}
      </View>

      {!post ? (
        <Text style={styles.notFound}>Article not found.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            const contentHeight = event.nativeEvent.contentSize.height;
            const viewportHeight = event.nativeEvent.layoutMeasurement.height;
            const percent = Math.max(
              0,
              Math.min(100, ((y + viewportHeight) / Math.max(1, contentHeight)) * 100)
            );
            console.log("Scroll percent:", percent);
            if (percent > maxCompletionRef.current) {
              maxCompletionRef.current = percent;
            }
          }}
        >
          <Text style={styles.title}>{post.title}</Text>
          {post.excerpt ? <Text style={styles.summary}>{post.excerpt}</Text> : null}
          <Text style={styles.meta}>
            {estimateReadMinutes(post.content)} min read · {formatDate(post.createdAt)}
          </Text>
          {isAdmin ? (
            <Text style={styles.analyticsMeta}>
              {post.viewCount ?? 0} Views · {post.uniqueViewerCount ?? 0} Unique ·{" "}
              {Math.round(post.avgCompletion ?? 0)}% Completion
            </Text>
          ) : null}

          {paragraphs.map((paragraph, index) => (
            <Text key={`${post.id}-p-${index}`} style={styles.body}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: {
  background: string;
  text: string;
  mutedText: string;
  subtleText: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 74,
      paddingHorizontal: 24,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    backButton: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingRight: 8,
    },
    backText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
    },
    menuButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginRight: -8,
    },
    menuButtonText: {
      color: colors.subtleText,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.4,
    },
    scrollContent: {
      paddingBottom: 30,
      gap: 16,
    },
    title: {
      color: colors.text,
      fontSize: 36,
      lineHeight: 44,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    summary: {
      color: colors.mutedText,
      fontSize: 17,
      lineHeight: 27,
      marginTop: -2,
      marginBottom: 6,
    },
    meta: {
      color: colors.subtleText,
      fontSize: 13,
    },
    analyticsMeta: {
      color: colors.subtleText,
      fontSize: 11,
      lineHeight: 16,
      marginTop: -8,
    },
    body: {
      color: colors.mutedText,
      fontSize: 19,
      lineHeight: 34,
    },
    notFound: {
      color: colors.subtleText,
      fontSize: 15,
    },
  });
