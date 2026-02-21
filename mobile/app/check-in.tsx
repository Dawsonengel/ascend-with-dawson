import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { saveCheckIn } from "@/data/local-store";

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const steps = useMemo(() => Array.from({ length: 10 }, (_, index) => index + 1), []);

  return (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}/10</Text>
      </View>

      <View style={styles.track}>
        {steps.map((step) => {
          const active = step <= value;
          return (
            <Pressable
              key={step}
              onPress={() => onChange(step)}
              style={[styles.dot, active && styles.dotActive]}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function CheckInScreen() {
  const router = useRouter();
  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [reflection, setReflection] = useState("");

  const onSave = () => {
    saveCheckIn({ mood, energy, reflection });
    Alert.alert("Saved", "Check-in stored locally for this session.");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Daily Check-In</Text>
      <Card style={styles.card}>
        <SliderRow label="Mood" value={mood} onChange={setMood} />
        <SliderRow label="Energy" value={energy} onChange={setEnergy} />

        <Text style={styles.label}>Reflection</Text>
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="How did you show up for yourself today?"
          placeholderTextColor={theme.colors.subtleText}
          multiline
          textAlignVertical="top"
          style={styles.input}
        />

        <PrimaryButton label="Save" onPress={onSave} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
  },
  card: {
    gap: 16,
  },
  sliderGroup: {
    gap: 10,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  track: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  dotActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  input: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
  },
});
