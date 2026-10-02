import { useEffect, useState } from "react";
import { ThemeProvider } from "expo-router/react-navigation";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import 'react-native-reanimated';

import { AppThemeProvider, useAppTheme } from "@/components/Theme";
import { MembershipProvider } from '@/context/MembershipContext';
import { AuthProvider } from "../contexts/AuthContext";

export const unstable_settings = {
  anchor: '(tabs)',
};

const HOME_SCREEN_PROMPT_KEY = "hasSeenHomeScreenPrompt";
const IOS_FONT_STACK = '-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",sans-serif';

function toSvgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SHARE_ICON_URI = toSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 16V4"/>
  <path d="M8.5 7.5L12 4l3.5 3.5"/>
  <path d="M5 13.5v4A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-4"/>
</svg>`);

const PLUS_ICON_URI = toSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="4" width="16" height="16" rx="4"/>
  <path d="M12 8v8"/>
  <path d="M8 12h8"/>
</svg>`);

const CHECK_ICON_URI = toSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="8"/>
  <path d="M8.8 12.2l2.2 2.2 4.4-4.4"/>
</svg>`);

function shouldShowHomeScreenPrompt() {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent ?? "";
  const isIPhoneSafari =
    /iPhone/.test(userAgent) &&
    /Safari/.test(userAgent) &&
    !/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(userAgent);

  const isStandalone =
    (window.navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)")?.matches === true;

  const hasSeen = window.localStorage.getItem(HOME_SCREEN_PROMPT_KEY) === "true";
  return isIPhoneSafari && !isStandalone && !hasSeen;
}

function HomeScreenPromptModal() {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!shouldShowHomeScreenPrompt()) {
      return;
    }

    setIsRendered(true);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(HOME_SCREEN_PROMPT_KEY, "true");
    }
    setIsVisible(false);
    setTimeout(() => setIsRendered(false), 240);
  };

  if (!isRendered) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.promptOverlay,
          { opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? "auto" : "none" },
        ]}
        accessible
        accessibilityLabel="Install app prompt"
        accessibilityViewIsModal
      >
        <View
          style={[
            styles.promptCard,
            {
              opacity: isVisible ? 1 : 0,
              transform: [{ scale: isVisible ? 1 : 0.97 }],
            },
            {
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
            } as never,
          ]}
        >
          <Text style={styles.promptTitle}>Install App</Text>
          <Text style={styles.promptBody}>Open Ascend faster from your Home Screen.</Text>

          <View style={styles.stepRow}>
            <Image source={{ uri: SHARE_ICON_URI }} style={styles.stepIcon} />
            <Text style={styles.stepText}>Tap the Share icon</Text>
          </View>
          <View style={styles.stepDivider} />
          <View style={styles.stepRow}>
            <Image source={{ uri: PLUS_ICON_URI }} style={styles.stepIcon} />
            <Text style={styles.stepText}>Select &quot;Add to Home Screen&quot;</Text>
          </View>
          <View style={styles.stepDivider} />
          <View style={styles.stepRow}>
            <Image source={{ uri: CHECK_ICON_URI }} style={styles.stepIcon} />
            <Text style={styles.stepText}>Tap &quot;Add&quot;</Text>
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={dismiss}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Continue to close install prompt"
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
            <Pressable
              onPress={dismiss}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Not now"
            >
              <Text style={styles.dismissText}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MembershipProvider>
        <AppThemeProvider>
          <RootNavigator />
        </AppThemeProvider>
      </MembershipProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { navigationTheme, resolvedScheme } = useAppTheme();
  const navigatorBackground = navigationTheme.colors.background;

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: navigatorBackground },
          headerStyle: { backgroundColor: navigatorBackground },
          headerShadowVisible: false,
          headerTintColor: navigationTheme.colors.text,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Settings" }} />
        <Stack.Screen name="auth" options={{ title: "Account" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
      <HomeScreenPromptModal />
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  promptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    transitionProperty: "opacity",
    transitionDuration: "220ms",
    transitionTimingFunction: "ease-out",
  } as never,
  promptCard: {
    width: "92%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "rgba(248,250,252,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    transitionProperty: "opacity, transform",
    transitionDuration: "240ms",
    transitionTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  } as never,
  promptTitle: {
    fontFamily: IOS_FONT_STACK,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  promptBody: {
    fontFamily: IOS_FONT_STACK,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 19,
    color: "#4b5563",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  stepIcon: {
    width: 18,
    height: 18,
  },
  stepText: {
    fontFamily: IOS_FONT_STACK,
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: "#1f2937",
  },
  stepDivider: {
    height: 1,
    backgroundColor: "rgba(107, 114, 128, 0.18)",
  },
  buttonRow: {
    marginTop: 14,
    alignItems: "center",
    gap: 6,
  },
  primaryButton: {
    alignSelf: "stretch",
    borderRadius: 14,
    backgroundColor: "rgba(17, 24, 39, 0.88)",
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontFamily: IOS_FONT_STACK,
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "600",
  },
  dismissButton: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: IOS_FONT_STACK,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});
