import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { createBlogPost } from "@/data/blogStore";

export default function NewBlogPostScreen() {
  const router = useRouter();
  const { isAdmin } = useMembership();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const onSave = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing fields", "Add a title and content before saving.");
      return;
    }

    const post = createBlogPost({ title, content });
    router.replace(`/blog/${post.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "New Post" }} />

      {!isAdmin ? (
        <Card>
          <Text style={styles.header}>Admin only</Text>
          <Text style={styles.helpText}>You need admin access to create posts.</Text>
        </Card>
      ) : (
        <Card style={styles.formCard}>
          <Text style={styles.header}>New Blog Post</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.subtleText}
            style={styles.input}
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Content"
            placeholderTextColor={theme.colors.subtleText}
            multiline
            textAlignVertical="top"
            style={styles.textarea}
          />
          <PrimaryButton label="Save" onPress={onSave} />
        </Card>
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
  formCard: {
    gap: 10,
  },
  header: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  helpText: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    color: theme.colors.text,
    fontSize: 15,
  },
  textarea: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
