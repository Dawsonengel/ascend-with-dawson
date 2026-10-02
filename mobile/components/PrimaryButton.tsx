import { useMemo } from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { useAppTheme } from "@/components/Theme";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: { primaryButton: string; primaryButtonText: string }) =>
  StyleSheet.create({
    button: {
      backgroundColor: colors.primaryButton,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      color: colors.primaryButtonText,
      fontSize: 16,
      fontWeight: "700",
    },
  });
