import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAppTheme } from "@/components/Theme";
import { saveCheckIn } from "@/data/local-store";

function SliderRow({
  label,
  value,
  onChange,
  styles,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  styles: ReturnType<typeof createStyles>;
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <SliderRow label="Mood" value={mood} onChange={setMood} styles={styles} />
        <SliderRow label="Energy" value={energy} onChange={setEnergy} styles={styles} />

        <Text style={styles.label}>Reflection</Text>
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="How did you show up for yourself today?"
          placeholderTextColor={colors.subtleText}
          multiline
          textAlignVertical="top"
          style={styles.input}
        />

        <PrimaryButton label="Save" onPress={onSave} />
      </Card>
    </View>
  );
}

const createStyles = (colors: {
  background: string;
  border: string;
  text: string;
  mutedText: string;
}) =>
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
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    value: {
      color: colors.mutedText,
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
      borderColor: colors.border,
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    dotActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
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
