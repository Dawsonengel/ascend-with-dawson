import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { theme } from "@/components/Theme";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primaryButton,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: theme.colors.primaryButtonText,
    fontSize: 16,
    fontWeight: "700",
  },
});
