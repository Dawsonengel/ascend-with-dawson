import { useFocusEffect } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { BlogPost } from "@/data/blogPosts";
import { getBlogPostById } from "@/data/blogStore";

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useMembership();

  const [post, setPost] = useState<BlogPost | undefined>(() => getBlogPostById(params.id ?? ""));

  useFocusEffect(
    useCallback(() => {
      setPost(getBlogPostById(params.id ?? ""));
    }, [params.id]),
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Blog" }} />

      {!post ? (
        <Card>
          <Text style={styles.title}>Post not found</Text>
          <Text style={styles.content}>This post is unavailable in local storage.</Text>
        </Card>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
            <Text style={styles.content}>{post.content}</Text>

            {isAdmin ? (
              <PrimaryButton label="Edit Post" onPress={() => router.push(`/blog/edit/${post.id}`)} />
            ) : null}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  date: {
    color: theme.colors.subtleText,
    fontSize: 13,
  },
  content: {
    color: theme.colors.mutedText,
    fontSize: 16,
    lineHeight: 26,
  },
});
