import { Stack, useLocalSearchParams } from "expo-router";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { getEbookById } from "@/data/ebooks";

export default function EbookDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const ebook = getEbookById(params.id ?? "");

  const openPdf = async () => {
    if (!ebook?.pdfUrl) {
      return;
    }

    const canOpen = await Linking.canOpenURL(ebook.pdfUrl);
    if (!canOpen) {
      Alert.alert("Unable to open", "This URL is not supported on this device.");
      return;
    }

    await Linking.openURL(ebook.pdfUrl);
  };

  if (!ebook) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Ebook" }} />
        <Card>
          <Text style={styles.title}>Ebook not found</Text>
          <Text style={styles.description}>This ebook does not exist in the local library.</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Ebook" }} />
      <Card style={styles.card}>
        <View style={[styles.cover, { backgroundColor: ebook.coverColor }]} />
        <Text style={styles.title}>{ebook.title}</Text>
        <Text style={styles.subtitle}>{ebook.subtitle}</Text>
        <Text style={styles.description}>{ebook.description}</Text>
        <Text style={styles.progress}>Progress: —</Text>

        <PrimaryButton label="Read Now" onPress={openPdf} />
        <Pressable onPress={openPdf} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Download</Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  card: {
    gap: 12,
  },
  cover: {
    width: "100%",
    height: 170,
    borderRadius: 14,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.subtleText,
    fontSize: 15,
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
  progress: {
    color: theme.colors.subtleText,
    fontSize: 14,
    marginTop: 2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
