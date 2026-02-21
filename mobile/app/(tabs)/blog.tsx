import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { LockedGate } from "@/components/LockedGate";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { BlogPost } from "@/data/blogPosts";
import { listBlogPosts } from "@/data/blogStore";

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogTabScreen() {
  const router = useRouter();
  const { isPaid, isAdmin } = useMembership();
  const [posts, setPosts] = useState<BlogPost[]>(() => listBlogPosts());

  useFocusEffect(
    useCallback(() => {
      setPosts(listBlogPosts());
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blog</Text>

      {!isPaid ? (
        <LockedGate
          title="Blog Access Locked"
          lineOne="Members can read the full private article archive."
          lineTwo="Unlock deep-dive posts and execution playbooks."
        />
      ) : (
        <>
          {isAdmin ? <PrimaryButton label="New Post" onPress={() => router.push("/blog/new")} /> : null}

          {posts.map((post) => (
            <Pressable key={post.id} onPress={() => router.push(`/blog/${post.id}`)}>
              <Card style={styles.postCard}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postExcerpt}>{post.excerpt}</Text>
                <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 76,
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 2,
  },
  postCard: {
    gap: 8,
  },
  postTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  postExcerpt: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  postDate: {
    color: theme.colors.subtleText,
    fontSize: 12,
  },
});
