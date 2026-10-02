import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAppTheme } from "@/components/Theme";
import { saveWin } from "@/data/local-store";

export default function WinScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [text, setText] = useState("");

  const onSave = () => {
    const value = text.trim();
    if (!value) {
      Alert.alert("Add a win", "Share one small win before saving.");
      return;
    }

    saveWin(value);
    Alert.alert("Saved", "Win stored locally for this session.");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Log 1% Win</Text>
      <Card style={styles.card}>
        <Text style={styles.label}>What was your 1% win?</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="I honored one commitment to myself..."
          placeholderTextColor={colors.subtleText}
          style={styles.input}
          multiline
          textAlignVertical="top"
        />

        <PrimaryButton label="Save" onPress={onSave} />
      </Card>
    </View>
  );
}

const createStyles = (colors: { background: string; border: string; text: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 80,
      paddingHorizontal: 20,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "800",
      marginBottom: 16,
    },
    card: {
      gap: 14,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    input: {
      minHeight: 120,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "rgba(255,255,255,0.04)",
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      lineHeight: 20,
    },
  });
