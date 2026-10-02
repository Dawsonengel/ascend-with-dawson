import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebaseConfig";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme } = useAppTheme();
  const { login, register } = useAuth();
  const styles = useMemo(() => createStyles(colors, resolvedScheme), [colors, resolvedScheme]);
  const toastOpacity = useState(() => new Animated.Value(0))[0];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [publicUsername, setPublicUsername] = useState("");
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Welcome back.");
  const [errorText, setErrorText] = useState("");

  const runWelcomeToastThenGoHome = async (message: "Welcome back." | "Welcome.") => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // noop
    }

    setToastMessage(message);
    setShowToast(true);
    await new Promise<void>((resolve) => {
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => resolve());
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    await new Promise<void>((resolve) => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => resolve());
    });

    setShowToast(false);
    router.replace("/(tabs)");
  };

  const onSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || submitting) {
      return;
    }

    try {
      setErrorText("");
      setSubmitting(true);
      if (mode === "signin") {
        await login(trimmedEmail, password);
        await runWelcomeToastThenGoHome("Welcome back.");
      } else {
        const normalizedUsername = publicUsername.trim().toLowerCase();
        if (!/^[a-z0-9]{3,20}$/.test(normalizedUsername)) {
          setErrorText(
            "Public Username must be 3-20 characters using lowercase letters and numbers only."
          );
          return;
        }

        const usernameQuery = query(
          collection(db, "users"),
          where("publicUsername", "==", normalizedUsername),
          limit(1)
        );
        const usernameSnap = await getDocs(usernameQuery);
        if (!usernameSnap.empty) {
          setErrorText("That public username is already taken.");
          return;
        }

        await register(trimmedEmail, password, normalizedUsername);
        await runWelcomeToastThenGoHome("Welcome.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to continue. Please try again.";
      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Stack.Screen options={{ title: "Account" }} />
      {showToast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <Animated.View
            style={[
              styles.toast,
              {
                opacity: toastOpacity,
                top: insets.top + 12,
                shadowOpacity: colors.background === "#0A0C0F" ? 0 : 0.07,
              },
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <Text style={styles.title}>{mode === "signin" ? "Sign In" : "Create Account"}</Text>
          <Text style={styles.subtitle}>Use your email to continue.</Text>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setMode("signin")}
              style={[styles.modeButton, mode === "signin" && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, mode === "signin" && styles.modeTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("create")}
              style={[styles.modeButton, mode === "create" && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, mode === "create" && styles.modeTextActive]}>Create</Text>
            </Pressable>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={styles.placeholderText.color}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={styles.placeholderText.color}
            secureTextEntry
          />

          {mode === "create" ? (
            <View style={styles.usernameWrap}>
              <Text style={styles.usernameLabel}>Public Username</Text>
              <TextInput
                value={publicUsername}
                onChangeText={setPublicUsername}
                style={styles.input}
                placeholder="choose a username"
                placeholderTextColor={styles.placeholderText.color}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <Pressable
            onPress={() => void onSubmit()}
            style={[
              styles.submitButton,
              (!email.trim() || !password || (mode === "create" && !publicUsername.trim()) || submitting) &&
                styles.submitButtonDisabled,
            ]}
            disabled={!email.trim() || !password || (mode === "create" && !publicUsername.trim()) || submitting}
          >
            {submitting ? (
              <View style={styles.submitLoading}>
                <ActivityIndicator size="small" color={styles.submitText.color} />
                <Text style={styles.submitText}>{mode === "signin" ? "Signing In" : "Creating Account"}</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>{mode === "signin" ? "Sign In" : "Create Account"}</Text>
            )}
          </Pressable>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        </View>
      </View>
    </KeyboardAvoidingView>
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
}, resolvedScheme: "light" | "dark") => {
  const isDark = resolvedScheme === "dark";
  const cardBackground = isDark ? "#F5F5F2" : "#151920";
  const cardText = isDark ? "#111827" : "#F3F4F6";
  const cardMutedText = isDark ? "rgba(17,24,39,0.62)" : "rgba(243,244,246,0.68)";
  const cardSubtleText = isDark ? "rgba(17,24,39,0.50)" : "rgba(243,244,246,0.56)";
  const inputBackground = isDark ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.08)";
  const inputBorder = isDark ? "rgba(15,23,42,0.14)" : "rgba(255,255,255,0.14)";
  const buttonBackground = isDark ? "#111827" : "#F3F4F6";
  const buttonText = isDark ? "#F8FAFC" : "#0F172A";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 24,
    },
    centerWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 96,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 22,
      paddingHorizontal: 40,
      paddingVertical: 40,
      gap: 18,
      backgroundColor: cardBackground,
      borderWidth: 1,
      borderColor: inputBorder,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.12 : 0.22,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    title: {
      fontSize: 30,
      fontWeight: "700",
      color: cardText,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      color: cardMutedText,
      marginBottom: 2,
    },
    modeRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 2,
    },
    modeButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: inputBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: "transparent",
      alignItems: "center",
    },
    modeButtonActive: {
      backgroundColor: inputBackground,
    },
    modeText: {
      fontSize: 13,
      fontWeight: "600",
      color: cardSubtleText,
    },
    modeTextActive: {
      color: cardText,
    },
    input: {
      borderWidth: 1,
      borderColor: inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: cardText,
      backgroundColor: inputBackground,
      fontSize: 15,
      minHeight: 48,
    },
    placeholderText: {
      color: cardSubtleText,
    },
    usernameWrap: {
      gap: 8,
    },
    usernameLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: cardText,
    },
    submitButton: {
      marginTop: 4,
      borderRadius: 12,
      backgroundColor: buttonBackground,
      paddingVertical: 13,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    submitText: {
      fontSize: 14,
      fontWeight: "600",
      color: buttonText,
    },
    errorText: {
      fontSize: 12,
      lineHeight: 17,
      color: cardMutedText,
      marginTop: 2,
    },
    toastWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      zIndex: 20,
    },
    toast: {
      position: "absolute",
      borderRadius: 18,
      backgroundColor: "#FFFFFF",
      paddingVertical: 12,
      paddingHorizontal: 18,
      shadowColor: "#000",
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    toastText: {
      color: "#111827",
      fontSize: 13,
      fontWeight: "500",
    },
  });
};
