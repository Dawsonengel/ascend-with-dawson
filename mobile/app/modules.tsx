import { useFocusEffect } from "expo-router/react-navigation";
import { Link, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { LockedGate } from "@/components/LockedGate";
import { useAppTheme } from "@/components/Theme";
import { useMembership } from "@/context/MembershipContext";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, getDocFromServer } from "firebase/firestore";

const PROTOCOL_DAYS = 90;

type ProtocolState = {
  currentDay: number;
  completedDays: number[];
};

export default function ModulesScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { hasPremiumAccess } = useMembership();
  const [state, setState] = useState<ProtocolState>({ currentDay: 1, completedDays: [] });

  const loadProtocolState = useCallback(async () => {
    if (!user?.uid) {
      setState({ currentDay: 1, completedDays: [] });
      return;
    }

    try {
      const snap = await getDocFromServer(doc(db, "users", user.uid));
      const data = snap.data() as { protocolCurrentDay?: number; protocolCompletedDays?: number[] } | undefined;
      const currentDay = Math.max(1, Math.min(PROTOCOL_DAYS, data?.protocolCurrentDay ?? 1));
      const completedDays = Array.isArray(data?.protocolCompletedDays)
        ? data!.protocolCompletedDays.filter((value) => Number.isInteger(value) && value >= 1 && value <= PROTOCOL_DAYS)
        : [];

      setState({ currentDay, completedDays });
    } catch (error) {
      console.error("[Modules] Failed to load protocol", error);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void loadProtocolState();
    }, [loadProtocolState])
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>90-Day Stability Protocol</Text>
      <Text style={styles.subtitle}>Day {state.currentDay} is your active focus.</Text>

      {!hasPremiumAccess ? (
        <LockedGate
          title="Protocol Access Locked"
          lineOne="Premium access is required for the 90-day protocol."
          lineTwo="Unlock to continue your stability progression."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {Array.from({ length: PROTOCOL_DAYS }, (_, idx) => idx + 1).map((day) => {
          const isPast = day < state.currentDay;
          const isCurrent = day === state.currentDay;
          const isFuture = day > state.currentDay;
          const availableIn = day - state.currentDay;
          const completed = state.completedDays.includes(day);

          const card = (
            <Card
              style={[
                styles.dayCard,
                isCurrent && styles.currentCard,
                isFuture && styles.lockedCard,
              ]}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>Day {day}</Text>
                <Text style={styles.dayStatus}>
                  {isCurrent ? "Today" : isPast ? (completed ? "Complete" : "Review") : "Locked"}
                </Text>
              </View>
              <Text style={styles.dayBody}>
                {isCurrent
                  ? "Complete your protocol entry for today."
                  : isPast
                    ? "Review your prior entry and maintain clarity."
                    : `Available in ${availableIn} day${availableIn === 1 ? "" : "s"}.`}
              </Text>
            </Card>
          );

          if (isFuture) {
            return <View key={day}>{card}</View>;
          }

          return (
            <Link key={day} href={`/modules/${day}`} asChild>
              <Pressable>{card}</Pressable>
            </Link>
          );
        })}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: {
  background: string;
  text: string;
  subtleText: string;
  mutedText: string;
  accent: string;
}) =>
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
      marginBottom: 6,
    },
    subtitle: {
      color: colors.subtleText,
      fontSize: 14,
      marginBottom: 14,
    },
    scrollContent: {
      gap: 10,
      paddingBottom: 24,
    },
    dayCard: {
      gap: 8,
    },
    currentCard: {
      borderColor: colors.accent,
    },
    lockedCard: {
      opacity: 0.46,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dayTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    dayStatus: {
      color: colors.subtleText,
      fontSize: 12,
      fontWeight: "600",
    },
    dayBody: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 20,
    },
  });
