import { PropsWithChildren, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

import { useAppTheme } from "@/components/Theme";

type CardProps = PropsWithChildren<
  ViewProps & {
    style?: StyleProp<ViewStyle>;
  }
>;

export function Card({ children, style, ...rest }: CardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View {...rest} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const createStyles = (colors: { card: string; border: string }) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
  });
