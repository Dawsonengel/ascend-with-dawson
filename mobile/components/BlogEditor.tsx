import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppTheme } from "@/components/Theme";

type BlogEditorMode = "create" | "edit";

export type BlogEditorValues = {
  title: string;
  summary: string;
  body: string;
};

type BlogEditorProps = {
  mode: BlogEditorMode;
  autosaveKey: string;
  initialValues: BlogEditorValues;
  onBack: () => void;
  onSubmit: (values: BlogEditorValues) => Promise<void>;
};

type DraftState = "idle" | "saving" | "saved";

export function BlogEditor({ mode, autosaveKey, initialValues, onBack, onSubmit }: BlogEditorProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState(initialValues.title);
  const [summary, setSummary] = useState(initialValues.summary);
  const [body, setBody] = useState(initialValues.body);
  const [draftState, setDraftState] = useState<DraftState>("idle");
  const [didLoadDraft, setDidLoadDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    setTitle(initialValues.title);
    setSummary(initialValues.summary);
    setBody(initialValues.body);
    setDidLoadDraft(false);
    setSubmitNotice("");

    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(autosaveKey);
        if (!isMounted || !raw) {
          return;
        }

        const parsed = JSON.parse(raw) as Partial<BlogEditorValues>;
        setTitle(parsed.title ?? initialValues.title);
        setSummary(parsed.summary ?? initialValues.summary);
        setBody(parsed.body ?? initialValues.body);
      } catch (error) {
        console.error("[BlogEditor] Failed to load draft", error);
      } finally {
        if (isMounted) {
          setDidLoadDraft(true);
        }
      }
    };

    void loadDraft();

    return () => {
      isMounted = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [autosaveKey, initialValues.body, initialValues.summary, initialValues.title]);

  useEffect(() => {
    if (!didLoadDraft) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setDraftState("saving");
    saveTimerRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(
          autosaveKey,
          JSON.stringify({
            title,
            summary,
            body,
          } satisfies BlogEditorValues)
        );
        setDraftState("saved");
      } catch (error) {
        console.error("[BlogEditor] Failed to save draft", error);
        setDraftState("idle");
      }
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [autosaveKey, body, didLoadDraft, summary, title]);

  const canSubmit = Boolean(title.trim() && body.trim());
  const screenTitle = mode === "create" ? "New Post" : "Edit Post";
  const submitLabel = mode === "create" ? "Publish" : "Save Changes";

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        summary,
        body,
      });
      await AsyncStorage.removeItem(autosaveKey);
      setSubmitNotice(mode === "create" ? "Published" : "Saved");
    } catch (error) {
      console.error("[BlogEditor] Submit failed", error);
      Alert.alert("Unable to save", "Please try again.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.screenTitle}>{screenTitle}</Text>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={({ pressed }) => [
            styles.publishButton,
            (!canSubmit || isSubmitting) && styles.publishButtonDisabled,
            pressed && canSubmit && !isSubmitting && styles.publishButtonPressed,
          ]}
        >
          <Text style={styles.publishButtonText}>{isSubmitting ? "Saving..." : submitLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.editorContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Post title"
          placeholderTextColor={colors.subtleText}
          style={styles.titleInput}
          selectionColor={colors.text}
        />

        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Short summary (1–2 sentences)"
          placeholderTextColor={colors.subtleText}
          style={styles.summaryInput}
          selectionColor={colors.text}
        />

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write your post..."
          placeholderTextColor={colors.subtleText}
          multiline
          textAlignVertical="top"
          style={styles.bodyInput}
          selectionColor={colors.text}
        />

        <Text style={styles.savedText}>
          {draftState === "saving" ? "Saving..." : draftState === "saved" ? "Saved" : " "}
        </Text>
        {submitNotice ? <Text style={styles.publishNotice}>{submitNotice}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
      paddingTop: 70,
      paddingHorizontal: 20,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    backButton: {
      paddingVertical: 6,
      paddingRight: 10,
    },
    backText: {
      color: colors.subtleText,
      fontSize: 15,
      fontWeight: "500",
    },
    screenTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    publishButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    publishButtonDisabled: {
      opacity: 0.35,
    },
    publishButtonPressed: {
      opacity: 0.7,
    },
    publishButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    editorContent: {
      paddingBottom: 30,
    },
    titleInput: {
      color: colors.text,
      fontSize: 35,
      lineHeight: 42,
      fontWeight: "800",
      letterSpacing: -0.4,
      paddingVertical: 8,
      marginBottom: 10,
    },
    summaryInput: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 20,
      paddingVertical: 8,
      marginBottom: 16,
    },
    bodyInput: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 31,
      minHeight: 360,
      paddingVertical: 8,
    },
    savedText: {
      color: colors.subtleText,
      fontSize: 12,
      marginTop: 10,
    },
    publishNotice: {
      color: colors.subtleText,
      fontSize: 12,
      marginTop: 4,
    },
  });
