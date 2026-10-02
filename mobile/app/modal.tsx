import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ThemePreference, useAppTheme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDevPremiumOverride, setIsDevPremiumOverride } = useMembership();
  const { colors, preference, setPreference } = useAppTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const onConfirmReset = async () => {
    if (!user?.uid || saving) {
      return;
    }

    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          protocolCurrentDay: 1,
          protocolCompletedDays: [],
        },
        { merge: true }
      );
      setShowResetConfirm(false);
      router.back();
    } catch (error) {
      console.error("[Settings] Failed to reset protocol", error);
      setShowResetConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
              <Text style={styles.headerBackText}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.title}>Settings</Text>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.segmentWrap}>
          {(["light", "dark", "system"] as ThemePreference[]).map((option) => {
            const selected = preference === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  void setPreference(option);
                }}
                style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {option === "light" ? "Light" : option === "dark" ? "Dark" : "System"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Protocol</Text>
        <Text style={styles.body}>
          Restarting clears completed protocol days and returns progress to Day 1.
        </Text>
        <PrimaryButton label="Restart Protocol" onPress={() => setShowResetConfirm(true)} />
      </Card>

      {__DEV__ ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <View style={styles.devRow}>
            <Text style={styles.body}>Premium Override</Text>
            <Switch
              value={isDevPremiumOverride}
              onValueChange={setIsDevPremiumOverride}
            />
          </View>
        </Card>
      ) : null}

      <Modal
        transparent
        visible={showResetConfirm}
        animationType="fade"
        onRequestClose={() => setShowResetConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restart Protocol?</Text>
            <Text style={styles.modalBody}>
              This will reset progress to Day 1 and clear completed days.
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowResetConfirm(false)} style={styles.modalSecondary}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirmReset} style={styles.modalPrimary}>
                <Text style={styles.modalPrimaryText}>{saving ? "Resetting..." : "Restart"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: {
  background: string;
  card: string;
  border: string;
  text: string;
  mutedText: string;
  subtleText: string;
  primaryButton: string;
  primaryButtonText: string;
  accent: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 84,
      paddingHorizontal: 20,
      gap: 12,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "800",
    },
    headerBackButton: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    headerBackText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
    },
    card: {
      gap: 10,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    body: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 20,
    },
    segmentWrap: {
      flexDirection: "row",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    segmentButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      backgroundColor: "transparent",
    },
    segmentButtonSelected: {
      backgroundColor: colors.card,
    },
    segmentText: {
      color: colors.subtleText,
      fontSize: 13,
      fontWeight: "600",
    },
    segmentTextSelected: {
      color: colors.text,
    },
    devRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 18,
      gap: 10,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    modalBody: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 20,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 6,
    },
    modalSecondary: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    modalSecondaryText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    modalPrimary: {
      borderRadius: 10,
      backgroundColor: colors.primaryButton,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    modalPrimaryText: {
      color: colors.primaryButtonText,
      fontSize: 13,
      fontWeight: "700",
    },
  });
