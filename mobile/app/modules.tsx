import { Link, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { theme } from "@/components/Theme";
import { modules } from "@/data/modules";

export default function ModulesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Modules</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {modules.map((module) => (
          <Link key={module.id} href={`/modules/${module.id}`} asChild>
            <Card style={styles.moduleCard}>
              <Text style={styles.category}>{module.category}</Text>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.description}>{module.description}</Text>
            </Card>
          </Link>
        ))}
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
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  moduleCard: {
    gap: 6,
  },
  category: {
    color: theme.colors.subtleText,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  moduleTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});
