import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";

const quickLinks = [
  { title: "Community", route: "/community" },
  { title: "Ebook", route: "/ebook" },
  { title: "Blog", route: "/blog" },
  { title: "Store", route: "/store" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { isPaid, togglePaid } = useMembership();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ascend</Text>
      <Text style={styles.subheader}>Instagram extension MVP</Text>

      <Card>
        <Text style={styles.sectionTitle}>Membership</Text>
        <Text style={styles.body}>{isPaid ? "Paid access enabled" : "Free mode: premium areas locked"}</Text>
        <PrimaryButton
          label={isPaid ? "Switch to Free" : "Simulate Paid Access"}
          onPress={togglePaid}
          style={styles.toggleButton}
        />
      </Card>

      <View style={styles.grid}>
        {quickLinks.map((link) => (
          <Pressable key={link.title} onPress={() => router.push(link.route)}>
            <Card style={styles.linkCard}>
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={styles.linkText}>Open</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 76,
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subheader: {
    color: theme.colors.subtleText,
    fontSize: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 21,
  },
  toggleButton: {
    marginTop: 12,
  },
  grid: {
    gap: 10,
  },
  linkCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  linkText: {
    color: theme.colors.subtleText,
    fontSize: 14,
  },
});
