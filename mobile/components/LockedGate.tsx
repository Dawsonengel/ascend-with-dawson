import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAppTheme } from "@/components/Theme";

type LockedGateProps = {
  title: string;
  lineOne: string;
  lineTwo: string;
};

export function LockedGate({ title, lineOne, lineTwo }: LockedGateProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{lineOne}</Text>
      <Text style={styles.body}>{lineTwo}</Text>
      <PrimaryButton label="Unlock Access" onPress={() => {}} />
    </Card>
  );
}

const createStyles = (colors: { text: string; mutedText: string }) =>
  StyleSheet.create({
    card: {
      gap: 10,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    body: {
      color: colors.mutedText,
      fontSize: 15,
      lineHeight: 22,
    },
  });
