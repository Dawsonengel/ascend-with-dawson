import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";

type LockedGateProps = {
  title: string;
  lineOne: string;
  lineTwo: string;
};

export function LockedGate({ title, lineOne, lineTwo }: LockedGateProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{lineOne}</Text>
      <Text style={styles.body}>{lineTwo}</Text>
      <PrimaryButton label="Unlock Access" onPress={() => {}} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
});
