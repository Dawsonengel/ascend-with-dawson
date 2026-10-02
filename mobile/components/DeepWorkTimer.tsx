import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { useAppTheme } from "@/components/Theme";

type DurationOption = 30 | 45;
type SessionState = "idle" | "running" | "paused" | "complete";
type DeepWorkTimerProps = {
  onFocusModeChange?: (isRunning: boolean) => void;
  onSessionRunningChange?: (isRunning: boolean) => void;
  onSessionStart?: () => void;
  onSessionComplete?: () => void;
};

const TIMER_RING_SIZE = 248;
const DOT_SIZE = 12;
const TICK_MS = 250;

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function DeepWorkTimer({
  onFocusModeChange,
  onSessionRunningChange,
  onSessionStart,
  onSessionComplete,
}: DeepWorkTimerProps) {
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, resolvedScheme), [colors, resolvedScheme]);
  const [duration, setDuration] = useState<DurationOption>(30);
  const [state, setState] = useState<SessionState>("idle");
  const [remainingMs, setRemainingMs] = useState(30 * 60_000);
  const [showReturn, setShowReturn] = useState(false);

  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const timerScaleAnim = useRef(new Animated.Value(0.985)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const ringRotation = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["360deg", "0deg"],
      }),
    [progressAnim]
  );

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const clearDoneTimeout = () => {
    if (doneTimeoutRef.current) {
      clearTimeout(doneTimeoutRef.current);
      doneTimeoutRef.current = null;
    }
  };

  const stopProgressAnimation = () => {
    if (progressAnimRef.current) {
      progressAnimRef.current.stop();
      progressAnimRef.current = null;
    }
  };

  const animateProgress = (durationMs: number) => {
    stopProgressAnimation();
    progressAnimRef.current = Animated.timing(progressAnim, {
      toValue: 0,
      duration: Math.max(0, durationMs),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    progressAnimRef.current.start();
  };

  const animateIntoFocus = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(timerScaleAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOutOfFocus = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(timerScaleAnim, {
        toValue: 0.985,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDone) {
        onDone();
      }
    });
  };

  const finishSession = async () => {
    clearTick();
    stopProgressAnimation();
    progressAnim.setValue(0);
    setRemainingMs(0);
    setState("complete");
    onSessionComplete?.();
    setShowReturn(false);
    try {
      // Completion uses a stronger system notification haptic.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }
    clearDoneTimeout();
    doneTimeoutRef.current = setTimeout(() => {
      setShowReturn(true);
    }, 1000);
  };

  const startTick = (endAt: number) => {
    clearTick();
    endAtRef.current = endAt;
    tickRef.current = setInterval(() => {
      const next = Math.max(0, endAt - Date.now());
      setRemainingMs(next);
      if (next <= 0) {
        void finishSession();
      }
    }, TICK_MS);
  };

  const start = async () => {
    const nextMs = duration * 60_000;
    progressAnim.setValue(1);
    setRemainingMs(nextMs);
    setState("running");
    onSessionStart?.();
    setShowReturn(false);
    animateIntoFocus();
    try {
      // Start uses a light impact haptic.
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // noop
    }
    startTick(Date.now() + nextMs);
    animateProgress(nextMs);
  };

  const togglePause = () => {
    if (state === "running") {
      clearTick();
      stopProgressAnimation();
      setState("paused");
      return;
    }
    if (state === "paused") {
      setState("running");
      startTick(Date.now() + remainingMs);
      animateProgress(remainingMs);
    }
  };

  const endSession = () => {
    clearTick();
    clearDoneTimeout();
    stopProgressAnimation();
    animateOutOfFocus(() => {
      setState("idle");
      setShowReturn(false);
      setRemainingMs(duration * 60_000);
      progressAnim.setValue(1);
      endAtRef.current = null;
    });
  };

  useEffect(() => {
    if (state === "idle") {
      setRemainingMs(duration * 60_000);
      progressAnim.setValue(1);
    }
  }, [duration, progressAnim, state]);

  useEffect(() => {
    return () => {
      clearTick();
      clearDoneTimeout();
      stopProgressAnimation();
    };
  }, []);

  useEffect(() => {
    onFocusModeChange?.(state !== "idle");
  }, [onFocusModeChange, state]);

  useEffect(() => {
    onSessionRunningChange?.(state === "running");
  }, [onSessionRunningChange, state]);

  return (
    <>
      <View style={styles.idleCard}>
        <Text style={styles.idleTitle}>DEEP WORK</Text>
        <Text style={styles.idleTime}>{formatMs(remainingMs)}</Text>
        <View style={styles.optionRow}>
          {[30, 45].map((minutes) => {
            const selected = duration === minutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => setDuration(minutes as DurationOption)}
                style={[styles.optionButton, selected && styles.optionButtonActive]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextActive]}>{minutes} MIN</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => void start()} style={styles.startButton}>
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>
      </View>

      {state !== "idle" ? (
        <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: overlayAnim }]}>
          <Animated.View style={[styles.focusWrap, { transform: [{ scale: timerScaleAnim }] }]}>
            <View style={styles.ringTrack}>
              <Animated.View style={[styles.ringOrbiter, { transform: [{ rotate: ringRotation }] }]}>
                <View style={styles.ringDot} />
              </Animated.View>
              <Text style={styles.focusTime}>{formatMs(remainingMs)}</Text>
            </View>

            <Text style={styles.focusCaption}>{state === "complete" ? "Session Complete." : "Focused."}</Text>

            <View style={styles.controlRow}>
              {state === "running" || state === "paused" ? (
                <Pressable onPress={togglePause} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{state === "running" ? "Pause" : "Resume"}</Text>
                </Pressable>
              ) : null}

              {state !== "complete" ? (
                <Pressable onPress={endSession} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>End Session</Text>
                </Pressable>
              ) : null}

              {state === "complete" && showReturn ? (
                <Pressable onPress={endSession} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Return</Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </>
  );
}

const createStyles = (
  colors: {
    background: string;
    card: string;
    border: string;
    text: string;
    mutedText: string;
    subtleText: string;
    primaryButton: string;
    primaryButtonText: string;
    accent: string;
  },
  resolvedScheme: "light" | "dark"
) =>
  StyleSheet.create({
    idleCard: {
      borderRadius: 18,
      backgroundColor: resolvedScheme === "light" ? "#FBFBF8" : colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 18,
      paddingVertical: 16,
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: resolvedScheme === "light" ? 0.08 : 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    idleTitle: {
      fontSize: 13,
      fontWeight: "500",
      letterSpacing: 1.2,
      color: colors.subtleText,
    },
    idleTime: {
      fontSize: 52,
      fontWeight: "300",
      letterSpacing: -0.8,
      color: colors.text,
      alignSelf: "center",
    },
    optionRow: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
    },
    optionButton: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: "transparent",
    },
    optionButtonActive: {
      backgroundColor: colors.primaryButton,
      borderColor: colors.primaryButton,
    },
    optionText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
      letterSpacing: 0.3,
    },
    optionTextActive: {
      color: colors.primaryButtonText,
    },
    startButton: {
      alignSelf: "center",
      borderRadius: 14,
      backgroundColor: colors.primaryButton,
      paddingVertical: 11,
      paddingHorizontal: 24,
    },
    startButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryButtonText,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        resolvedScheme === "light" ? "rgba(245,246,248,0.96)" : "rgba(14,14,14,0.94)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 40,
      paddingHorizontal: 20,
    },
    focusWrap: {
      width: "100%",
      alignItems: "center",
      gap: 18,
    },
    ringTrack: {
      width: TIMER_RING_SIZE,
      height: TIMER_RING_SIZE,
      borderRadius: TIMER_RING_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: resolvedScheme === "light" ? "#FCFCFA" : colors.background,
      shadowColor: "#000",
      shadowOpacity: resolvedScheme === "light" ? 0.07 : 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
    },
    ringOrbiter: {
      ...StyleSheet.absoluteFillObject,
    },
    ringDot: {
      position: "absolute",
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: colors.accent,
      top: -DOT_SIZE / 2,
      left: TIMER_RING_SIZE / 2 - DOT_SIZE / 2,
    },
    focusTime: {
      fontSize: 72,
      fontWeight: "300",
      color: colors.text,
      letterSpacing: -1.4,
    },
    focusCaption: {
      fontSize: 13,
      color: colors.subtleText,
      fontWeight: "500",
    },
    controlRow: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    secondaryButton: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: "transparent",
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    primaryButton: {
      borderRadius: 14,
      backgroundColor: colors.primaryButton,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryButtonText,
    },
  });
