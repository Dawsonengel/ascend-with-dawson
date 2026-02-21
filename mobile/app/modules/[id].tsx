import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { markModuleComplete } from "@/data/local-store";
import { getModuleById } from "@/data/modules";

export default function ModuleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const module = getModuleById(params.id);

  if (!module) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.title}>Module not found</Text>
      </View>
    );
  }

  const onComplete = () => {
    markModuleComplete(module.id);
    Alert.alert("Completed", "Module completion saved locally.");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>{module.title}</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Intro</Text>
          <Text style={styles.body}>{module.intro}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Content Blocks</Text>
          <Text style={styles.body}>Video: Placeholder lesson</Text>
          <Text style={styles.body}>PDF: Placeholder workbook</Text>
          <Text style={styles.body}>Audio: Placeholder integration track</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reflection Prompt</Text>
          <Text style={styles.body}>{module.reflectionPrompt}</Text>
        </Card>

        <PrimaryButton label="Mark Complete" onPress={onComplete} />
      </ScrollView>
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
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 16,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 21,
  },
});
