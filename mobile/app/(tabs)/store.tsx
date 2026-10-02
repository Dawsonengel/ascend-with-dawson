import { Linking, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAppTheme } from "@/components/Theme";

const STORE_URL = "https://example.com/store";

export default function StoreScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openStore = async () => {
    await Linking.openURL(STORE_URL);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Store</Text>
      <Card style={styles.card}>
        <Text style={styles.body}>Browse curated products and tools. Placeholder integration for pass 1.</Text>
        <PrimaryButton label="Open Store" onPress={openStore} />
      </Card>
    </View>
  );
}

const createStyles = (colors: { background: string; text: string; mutedText: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 76,
      paddingHorizontal: 20,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "800",
      marginBottom: 12,
    },
    card: {
      gap: 12,
    },
    body: {
      color: colors.mutedText,
      fontSize: 15,
      lineHeight: 22,
    },
  });
