import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

import { theme } from "@/components/Theme";

type CardProps = PropsWithChildren<
  ViewProps & {
    style?: StyleProp<ViewStyle>;
  }
>;

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View {...rest} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
});
