import { useFocusEffect } from "expo-router/react-navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DeepWorkTimer } from "@/components/DeepWorkTimer";
import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/context/MembershipContext";
import { db } from "@/firebaseConfig";
import { doc, getDocFromServer, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";

const PROTOCOL_DAYS = 90;
const RING_SIZE = 130;
const DEEP_WORK_STARTED_DAY_KEY_PREFIX = "deep_work_started_day_key_";
const REMINDER_BANNER_SURFACE = "#FFFFFF";
const REMINDER_BANNER_TEXT = "#111827";

type UserHomeData = {
  streakCount?: number;
  streakDayKey?: string;
  lastOpenedAt?: Timestamp;
  protocolCurrentDay?: number;
  protocolCompletedDays?: number[];
};

function utcDayKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousUtcDayKey(date: Date) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() - 1);
  return utcDayKey(copy);
}

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localWeekId(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekYear = weekStart.getFullYear();
  const firstDayOfYear = new Date(weekYear, 0, 1);
  firstDayOfYear.setHours(0, 0, 0, 0);

  const firstWeekStart = new Date(firstDayOfYear);
  firstWeekStart.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.floor((weekStart.getTime() - firstWeekStart.getTime()) / msPerWeek) + 1;

  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPremiumAccess } = useMembership();
  const { resolvedScheme } = useAppTheme();
  const isDark = resolvedScheme !== "light";
  const confirmAnim = useRef(new Animated.Value(0)).current;

  const [streakDays, setStreakDays] = useState(0);
  const [protocolDay, setProtocolDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [isTimerFocusModeActive, setIsTimerFocusModeActive] = useState(false);
  const [isDeepWorkRunning, setIsDeepWorkRunning] = useState(false);
  const [todayKey, setTodayKey] = useState(() => localDayKey(new Date()));
  const [startedSessionDayKey, setStartedSessionDayKey] = useState<string | null>(null);
  const [submittedReflectionWeekKey, setSubmittedReflectionWeekKey] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [nowLocal, setNowLocal] = useState(() => new Date());

  const palette = isDark
    ? {
        background: "#0A0C0F",
        surface: "#10151B",
        border: "rgba(255,255,255,0.10)",
        text: "#F3F4F6",
        muted: "rgba(243,244,246,0.62)",
        accent: "#9FB2C8",
        buttonText: "#0A0C0F",
        buttonFill: "#E5E7EB",
      }
    : {
        background: "#F5F6F8",
        surface: "#FFFFFF",
        border: "rgba(15,23,42,0.10)",
        text: "#111827",
        muted: "rgba(17,24,39,0.58)",
        accent: "#4A5F78",
        buttonText: "#F9FAFB",
        buttonFill: "#1F2937",
      };

  const protocolProgress = Math.min(protocolDay, PROTOCOL_DAYS) / PROTOCOL_DAYS;
  const sessionStorageKey = `${DEEP_WORK_STARTED_DAY_KEY_PREFIX}${user?.uid ?? "guest"}`;
  const shouldShowSessionReminder = !isDeepWorkRunning && startedSessionDayKey !== todayKey;
  const homeCardSurfaceStyle = { backgroundColor: palette.surface, borderColor: palette.border };
  const currentWeekId = localWeekId(nowLocal);
  const isSundayAfterFive = nowLocal.getDay() === 0 && nowLocal.getHours() >= 17;
  const shouldShowWeeklyReflectionPrompt =
    !isDeepWorkRunning &&
    isSundayAfterFive &&
    submittedReflectionWeekKey !== currentWeekId;

  const syncHomeData = useCallback(async () => {
    if (!user?.uid) {
      setStreakDays(0);
      setProtocolDay(1);
      setCompletedDays([]);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    try {
      await setDoc(userRef, { lastOpenedAt: serverTimestamp() }, { merge: true });
      const snap = await getDocFromServer(userRef);
      const data = (snap.data() ?? {}) as UserHomeData;
      const serverOpenedAt = data.lastOpenedAt?.toDate();
      if (!serverOpenedAt) {
        return;
      }

      const todayKey = utcDayKey(serverOpenedAt);
      const yesterdayKey = previousUtcDayKey(serverOpenedAt);
      const previousKey = data.streakDayKey ?? "";
      const previousCount = data.streakCount ?? 0;

      let nextCount = previousCount;
      if (previousKey === todayKey) {
        nextCount = previousCount || 1;
      } else if (previousKey === yesterdayKey) {
        nextCount = Math.max(1, previousCount + 1);
      } else {
        nextCount = 1;
      }

      const persistedCurrentDay = Math.max(1, Math.min(PROTOCOL_DAYS, data.protocolCurrentDay ?? 1));
      const persistedCompleted = Array.isArray(data.protocolCompletedDays)
        ? data.protocolCompletedDays.filter((v) => Number.isInteger(v) && v >= 1 && v <= PROTOCOL_DAYS)
        : [];

      await setDoc(
        userRef,
        {
          streakCount: nextCount,
          streakDayKey: todayKey,
          lastOpenedAt: serverTimestamp(),
          protocolCurrentDay: persistedCurrentDay,
          protocolCompletedDays: persistedCompleted,
        },
        { merge: true }
      );

      setStreakDays(nextCount);
      setProtocolDay(persistedCurrentDay);
      setCompletedDays(persistedCompleted);
    } catch (error) {
      console.error("[Home] Failed to sync home data", error);
    }
  }, [user?.uid]);

  const loadWeeklyReflectionState = useCallback(async () => {
    if (!user?.uid) {
      setSubmittedReflectionWeekKey(null);
      return;
    }

    try {
      const reflectionRef = doc(db, "users", user.uid, "weeklyReflections", currentWeekId);
      const reflectionSnap = await getDocFromServer(reflectionRef);
      setSubmittedReflectionWeekKey(reflectionSnap.exists() ? currentWeekId : null);
    } catch (error) {
      console.error("[Home] Failed to load weekly reflection state", error);
    }
  }, [currentWeekId, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setTodayKey(localDayKey(new Date()));
      void syncHomeData();
      void loadWeeklyReflectionState();
    }, [loadWeeklyReflectionState, syncHomeData])
  );

  useEffect(() => {
    let isMounted = true;

    const loadStartedSessionState = async () => {
      try {
        const savedDayKey = await AsyncStorage.getItem(sessionStorageKey);
        if (!isMounted) {
          return;
        }
        setStartedSessionDayKey(savedDayKey);
      } catch (error) {
        console.error("[Home] Failed to read deep work started state", error);
      }
    };

    void loadStartedSessionState();

    return () => {
      isMounted = false;
    };
  }, [sessionStorageKey]);

  useEffect(() => {
    void loadWeeklyReflectionState();
  }, [loadWeeklyReflectionState]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeout = setTimeout(() => {
      setTodayKey(localDayKey(new Date()));
    }, Math.max(0, nextMidnight.getTime() - now.getTime() + 50));

    return () => {
      clearTimeout(timeout);
    };
  }, [todayKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowLocal(new Date());
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleDeepWorkStart = useCallback(() => {
    const startedToday = localDayKey(new Date());
    setStartedSessionDayKey(startedToday);
    void AsyncStorage.setItem(sessionStorageKey, startedToday).catch((error) => {
      console.error("[Home] Failed to persist deep work started state", error);
    });
  }, [sessionStorageKey]);

  const handleWeeklyReflectionSubmit = useCallback(async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed) {
      return;
    }
    if (!user?.uid) {
      console.error("[Home] Missing authenticated user for weekly reflection submit");
      return;
    }

    try {
      const reflectionRef = doc(db, "users", user.uid, "weeklyReflections", currentWeekId);
      await setDoc(
        reflectionRef,
        {
          text: trimmed,
          createdAt: serverTimestamp(),
          weekId: currentWeekId,
        },
        { merge: true }
      );
      setSubmittedReflectionWeekKey(currentWeekId);
      setReflectionText("");
    } catch (error) {
      console.error("[Home] Failed to save weekly reflection", error);
    }
  }, [currentWeekId, reflectionText, user?.uid]);

  const runFocusConfirmation = () => {
    Animated.sequence([
      Animated.timing(confirmAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(700),
      Animated.timing(confirmAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleProfilePress = () => {
    if (user) {
      router.push("/profile");
      return;
    }
    router.push("/auth");
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isTimerFocusModeActive}
        bounces={!isTimerFocusModeActive}
      >
        <View style={styles.topBar}>
          <Pressable onPress={handleProfilePress} style={styles.profileButton} hitSlop={10}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color={isDark ? "rgba(243, 244, 246, 0.76)" : "rgba(107, 114, 128, 0.72)"}
            />
          </Pressable>
          <Pressable onPress={() => router.push("/modal")} style={styles.settingsButton}>
            <Text
              style={[
                styles.settingsText,
                { color: isDark ? "rgba(243, 244, 246, 0.76)" : "rgba(107, 114, 128, 0.72)" },
              ]}
            >
              Settings
            </Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={[styles.ringBase, { borderColor: palette.border }]}>
            <Text style={[styles.streakNumber, { color: palette.text }]}>{streakDays}</Text>
          </View>
          <Text style={[styles.heroLabel, { color: palette.text }]}>Days Showing Up</Text>
          <Text style={[styles.heroSupport, { color: palette.muted }]}>
            Everything you want is on the other side of hard
          </Text>
          {shouldShowSessionReminder ? (
            <View
              style={[
                styles.sessionReminderBanner,
                {
                  backgroundColor: REMINDER_BANNER_SURFACE,
                  shadowOpacity: isDark ? 0 : 0.07,
                },
              ]}
            >
              <Text style={[styles.sessionReminder, { color: REMINDER_BANNER_TEXT }]}>One session.</Text>
            </View>
          ) : null}
          {shouldShowWeeklyReflectionPrompt ? (
            <View
              style={[
                styles.weeklyReflectionBanner,
                {
                  backgroundColor: REMINDER_BANNER_SURFACE,
                  shadowOpacity: isDark ? 0 : 0.07,
                },
              ]}
            >
              <Text style={[styles.weeklyReflectionTitle, { color: REMINDER_BANNER_TEXT }]}>
                What did you build this week?
              </Text>
              <View style={styles.weeklyReflectionRow}>
                <TextInput
                  value={reflectionText}
                  onChangeText={setReflectionText}
                  placeholder="One line reflection"
                  placeholderTextColor="rgba(17,24,39,0.38)"
                  style={styles.weeklyReflectionInput}
                  returnKeyType="done"
                  onSubmitEditing={handleWeeklyReflectionSubmit}
                />
                <Pressable
                  style={[
                    styles.weeklyReflectionSubmitButton,
                    {
                      backgroundColor: palette.buttonFill,
                      opacity: reflectionText.trim() ? 1 : 0.55,
                    },
                  ]}
                  onPress={handleWeeklyReflectionSubmit}
                  disabled={!reflectionText.trim()}
                >
                  <Text style={[styles.weeklyReflectionSubmitText, { color: palette.buttonText }]}>
                    Submit
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <DeepWorkTimer
          onFocusModeChange={setIsTimerFocusModeActive}
          onSessionRunningChange={setIsDeepWorkRunning}
          onSessionStart={handleDeepWorkStart}
        />

        <View style={[styles.focusCard, homeCardSurfaceStyle]}>
          <Text style={[styles.focusTitle, { color: palette.text }]}>Today&apos;s Focus</Text>
          <Text style={[styles.focusBody, { color: palette.muted }]}>
            Protect one calm block and finish your highest-leverage task.
          </Text>
          <Pressable
            style={[styles.continueButton, { backgroundColor: palette.buttonFill }]}
            onPress={runFocusConfirmation}
          >
            <Text style={[styles.continueButtonText, { color: palette.buttonText }]}>Continue</Text>
          </Pressable>
          <Animated.Text
            style={[
              styles.confirmText,
              {
                color: palette.muted,
                opacity: confirmAnim,
                transform: [
                  {
                    translateY: confirmAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Locked in for today.
          </Animated.Text>
        </View>

        <View style={[styles.protocolCard, homeCardSurfaceStyle]}>
          <Text style={[styles.protocolLabel, { color: palette.muted }]}>
            Day {protocolDay} of {PROTOCOL_DAYS}
          </Text>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${protocolProgress * 100}%`, backgroundColor: palette.accent },
              ]}
            />
          </View>
          <Text style={[styles.protocolSubtle, { color: palette.muted }]}>
            {completedDays.length} completed
          </Text>
          <Pressable
            style={[styles.resumeButton, { borderColor: palette.border }]}
            onPress={() => router.push(hasPremiumAccess ? "/modules" : "/store")}
          >
            <Text style={[styles.resumeText, { color: palette.text }]}>Resume</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 22,
    paddingBottom: 64,
    gap: 22,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  settingsText: {
    fontSize: 13,
    fontWeight: "500",
  },
  hero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  ringBase: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  heroSupport: {
    fontSize: 13,
    lineHeight: 18,
  },
  sessionReminder: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    textAlign: "center",
  },
  sessionReminderBanner: {
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  weeklyReflectionBanner: {
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 22,
    width: "100%",
    shadowColor: "#000",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    gap: 10,
  },
  weeklyReflectionTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    textAlign: "center",
  },
  weeklyReflectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weeklyReflectionInput: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(17,24,39,0.06)",
    color: REMINDER_BANNER_TEXT,
    fontSize: 13,
  },
  weeklyReflectionSubmitButton: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  weeklyReflectionSubmitText: {
    fontSize: 13,
    fontWeight: "600",
  },
  focusCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  focusBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmText: {
    fontSize: 12,
    marginTop: 2,
  },
  protocolCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  protocolLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  protocolSubtle: {
    fontSize: 12,
  },
  resumeButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  resumeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
