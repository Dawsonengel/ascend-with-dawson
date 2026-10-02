import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { LockedGate } from "@/components/LockedGate";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAppTheme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, getDocFromServer, setDoc } from "firebase/firestore";

const PROTOCOL_DAYS = 90;

type ProtocolState = {
  currentDay: number;
  completedDays: number[];
};

function buildPrompt(day: number) {
  return `Day ${day} prompt: Identify one stabilizing action you will complete with full attention today.`;
}

export default function ModuleDetailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { hasPremiumAccess } = useMembership();
  const [state, setState] = useState<ProtocolState>({ currentDay: 1, completedDays: [] });
  const [saving, setSaving] = useState(false);

  const day = useMemo(() => {
    const parsed = Number(id ?? "");
    if (!Number.isInteger(parsed)) {
      return 1;
    }
    return Math.max(1, Math.min(PROTOCOL_DAYS, parsed));
  }, [id]);

  useEffect(() => {
    if (!user?.uid) {
      setState({ currentDay: 1, completedDays: [] });
      return;
    }

    getDocFromServer(doc(db, "users", user.uid))
      .then((snap) => {
        const data = snap.data() as { protocolCurrentDay?: number; protocolCompletedDays?: number[] } | undefined;
        const currentDay = Math.max(1, Math.min(PROTOCOL_DAYS, data?.protocolCurrentDay ?? 1));
        const completedDays = Array.isArray(data?.protocolCompletedDays)
          ? data!.protocolCompletedDays.filter((value) => Number.isInteger(value) && value >= 1 && value <= PROTOCOL_DAYS)
          : [];
        setState({ currentDay, completedDays });
      })
      .catch((error) => {
        console.error("[Protocol] Failed to load state", error);
      });
  }, [user?.uid]);

  const isFuture = day > state.currentDay;
  const isCurrent = day === state.currentDay;
  const isPast = day < state.currentDay;
  const availableIn = day - state.currentDay;

  const onCompleteDay = async () => {
    if (!user?.uid || !isCurrent || saving) {
      return;
    }

    const nextCompleted = Array.from(new Set([...state.completedDays, day])).sort((a, b) => a - b);
    const nextCurrent = Math.min(PROTOCOL_DAYS, day + 1);

    try {
      setSaving(true);
      await setDoc(
        doc(db, "users", user.uid),
        {
          protocolCompletedDays: nextCompleted,
          protocolCurrentDay: nextCurrent,
        },
        { merge: true }
      );
      setState({ currentDay: nextCurrent, completedDays: nextCompleted });
      Alert.alert("Saved", "Progress updated.");
      router.back();
    } catch (error) {
      console.error("[Protocol] Failed to save progress", error);
      Alert.alert("Error", "Unable to save progress right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Day {day}</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!hasPremiumAccess ? (
          <LockedGate
            title="Protocol Access Locked"
            lineOne="Premium access is required for advanced protocol content."
            lineTwo="Unlock to continue your progression."
          />
        ) : isFuture ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Locked</Text>
            <Text style={styles.body}>
              Available in {availableIn} day{availableIn === 1 ? "" : "s"}.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{isPast ? "Review" : "Today&apos;s Prompt"}</Text>
              <Text style={styles.body}>{buildPrompt(day)}</Text>
            </Card>

            {isCurrent ? (
              <PrimaryButton
                label={saving ? "Saving..." : "Mark Day Complete"}
                onPress={onCompleteDay}
              />
            ) : (
              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Completed</Text>
                <Text style={styles.body}>This day is archived for review.</Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: { background: string; text: string; mutedText: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 80,
      paddingHorizontal: 20,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "800",
      marginBottom: 16,
    },
    scrollContent: {
      gap: 12,
      paddingBottom: 24,
    },
    card: {
      gap: 8,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    body: {
      color: colors.mutedText,
      fontSize: 15,
      lineHeight: 21,
    },
  });
