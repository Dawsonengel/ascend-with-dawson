import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { getBlogPostById, updateBlogPost } from "@/data/blogStore";

export default function EditBlogPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useMembership();

  const existing = getBlogPostById(params.id ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");

  const onSave = () => {
    if (!title.trim() || !content.trim() || !existing) {
      Alert.alert("Missing fields", "Add a title and content before saving.");
      return;
    }

    updateBlogPost(existing.id, { title, content });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Edit Post" }} />

      {!isAdmin ? (
        <Card>
          <Text style={styles.header}>Admin only</Text>
          <Text style={styles.helpText}>You need admin access to edit posts.</Text>
        </Card>
      ) : !existing ? (
        <Card>
          <Text style={styles.header}>Post not found</Text>
          <Text style={styles.helpText}>This post cannot be edited.</Text>
        </Card>
      ) : (
        <Card style={styles.formCard}>
          <Text style={styles.header}>Edit Post</Text>
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
