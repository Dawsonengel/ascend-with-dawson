import { useMemo, useRef } from "react";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/components/Theme";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme } = useAppTheme();
  const { user, userData, logout } = useAuth();
  const styles = useMemo(() => createStyles(colors, resolvedScheme), [colors, resolvedScheme]);
  const rowDefaultBg = resolvedScheme === "dark" ? "#ECEDE7" : "#1A1F27";
  const rowPressedBg = resolvedScheme === "dark" ? "#DCDDD8" : "#252C37";
  const reflectionPress = useRef(new Animated.Value(0)).current;
  const passwordPress = useRef(new Animated.Value(0)).current;

  const publicUsername =
    typeof userData?.publicUsername === "string" && userData.publicUsername.trim()
      ? userData.publicUsername.trim()
      : "member";
  const avatarLetter = publicUsername.charAt(0).toUpperCase();
  const memberSinceText = useMemo(() => {
    const fromAuth = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
    if (fromAuth && !Number.isNaN(fromAuth.getTime())) {
      return `Member since ${fromAuth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })}`;
    }

    const rawCreatedAt = userData?.createdAt;
    let fallbackDate: Date | null = null;
    if (rawCreatedAt instanceof Date) {
      fallbackDate = rawCreatedAt;
    } else if (
      typeof rawCreatedAt === "object" &&
      rawCreatedAt !== null &&
      "toDate" in rawCreatedAt &&
      typeof (rawCreatedAt as { toDate: () => Date }).toDate === "function"
    ) {
      fallbackDate = (rawCreatedAt as { toDate: () => Date }).toDate();
    } else if (typeof rawCreatedAt === "string" || typeof rawCreatedAt === "number") {
      const parsed = new Date(rawCreatedAt);
      if (!Number.isNaN(parsed.getTime())) {
        fallbackDate = parsed;
      }
    }

    if (!fallbackDate) {
      return "Member";
    }

    return `Member since ${fallbackDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    })}`;
  }, [user?.metadata?.creationTime, userData?.createdAt]);

  const onSignOut = async () => {
    try {
      await logout();
      router.replace("/auth");
    } catch (error) {
      console.error("[Profile] Failed to sign out", error);
    }
  };

  const handleBack = () => {
    const activeRoute = rootNavigationState?.routes?.[rootNavigationState.index];
    const isModalPresentation =
      activeRoute?.name === "modal" ||
      (typeof activeRoute?.params === "object" &&
        activeRoute?.params !== null &&
        "presentation" in activeRoute.params &&
        activeRoute.params.presentation === "modal");

    if (isModalPresentation) {
      router.dismiss();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)");
  };

  const animateRowPress = (value: Animated.Value, toValue: number) => {
    Animated.timing(value, {
      toValue,
      duration: 130,
      useNativeDriver: false,
    }).start();
  };

  const reflectionRowBg = reflectionPress.interpolate({
    inputRange: [0, 1],
    outputRange: [rowDefaultBg, rowPressedBg],
  });
  const passwordRowBg = passwordPress.interpolate({
    inputRange: [0, 1],
    outputRange: [rowDefaultBg, rowPressedBg],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.manualHeader, { paddingTop: insets.top }]}>
        <View style={styles.manualHeaderRow}>
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            style={({ pressed }) => [styles.backBubble, pressed && styles.backPressed]}
          >
            <Ionicons name="chevron-back" size={18} color={styles.backIcon.color} />
          </Pressable>
          <View pointerEvents="none" style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 44 + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identitySection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={styles.usernameText}>@{publicUsername}</Text>
          <Text style={styles.roleText}>{memberSinceText}</Text>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Sunday Reflection</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => Alert.alert("Reflections", "Reflection history coming soon.")}
              onPressIn={() => animateRowPress(reflectionPress, 1)}
              onPressOut={() => animateRowPress(reflectionPress, 0)}
              style={styles.rowPressable}
            >
              <Animated.View style={[styles.row, { backgroundColor: reflectionRowBg }]}>
                <Text style={styles.rowLabel}>View Reflections</Text>
                <Text style={styles.rowChevron}>›</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email ?? "Not signed in"}</Text>
            </View>
            <View style={styles.divider} />
            <Pressable
              onPress={() => Alert.alert("Account", "Password management coming soon.")}
              onPressIn={() => animateRowPress(passwordPress, 1)}
              onPressOut={() => animateRowPress(passwordPress, 0)}
              style={styles.rowPressable}
            >
              <Animated.View style={[styles.row, { backgroundColor: passwordRowBg }]}>
                <Text style={styles.rowLabel}>Change Password</Text>
                <Text style={styles.rowChevron}>›</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>

        {user ? (
          <Pressable onPress={() => void onSignOut()} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.replace("/auth")} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign In</Text>
          </Pressable>
        )}
      </ScrollView>
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
}, resolvedScheme: "light" | "dark") => {
  const isDark = resolvedScheme === "dark";
  const pageBackground = isDark ? "#0A0C0F" : "#F3F4F2";
  const cardSurface = isDark ? "#ECEDE7" : "#1A1F27";
  const cardText = isDark ? "#111827" : "#F3F4F6";
  const cardMutedText = isDark ? "rgba(17,24,39,0.62)" : "rgba(243,244,246,0.68)";
  const cardSubtleText = isDark ? "rgba(17,24,39,0.52)" : "rgba(243,244,246,0.56)";
  const pageText = isDark ? "#F3F4F6" : "#1F2937";
  const pageMutedText = isDark ? "rgba(243,244,246,0.68)" : "rgba(31,41,55,0.58)";
  const dividerColor = isDark ? "rgba(17,24,39,0.12)" : "rgba(243,244,246,0.12)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: pageBackground,
    },
    manualHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: pageBackground,
      zIndex: 20,
    },
    manualHeaderRow: {
      height: 44,
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    backBubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: resolvedScheme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
    },
    backPressed: {
      opacity: 0.75,
    },
    backIcon: {
      color: pageText,
    },
    headerTitleWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: pageText,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 26,
      gap: 20,
      alignSelf: "center",
      width: "100%",
      maxWidth: 560,
    },
    identitySection: {
      alignItems: "center",
      paddingTop: 6,
      paddingBottom: 12,
      gap: 9,
    },
    avatarCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: cardSurface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: resolvedScheme === "dark" ? 0.14 : 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    avatarLetter: {
      fontSize: 30,
      fontWeight: "600",
      color: cardText,
    },
    usernameText: {
      fontSize: 28,
      fontWeight: "700",
      color: pageText,
      letterSpacing: -0.2,
    },
    roleText: {
      fontSize: 13,
      color: pageMutedText,
    },
    sectionWrap: {
      gap: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: pageMutedText,
      paddingHorizontal: 4,
      letterSpacing: 0.2,
    },
    card: {
      borderRadius: 20,
      backgroundColor: cardSurface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOpacity: resolvedScheme === "dark" ? 0.12 : 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    row: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowPressable: {
      borderRadius: 12,
      overflow: "hidden",
    },
    rowLabel: {
      fontSize: 15,
      color: cardText,
    },
    rowValue: {
      flex: 1,
      textAlign: "right",
      fontSize: 13,
      color: cardMutedText,
    },
    rowChevron: {
      fontSize: 20,
      lineHeight: 20,
      color: cardSubtleText,
      marginTop: -1,
    },
    divider: {
      height: 1,
      backgroundColor: dividerColor,
    },
    signOutButton: {
      alignSelf: "flex-start",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 8,
      marginTop: 2,
    },
    signOutText: {
      fontSize: 14,
      fontWeight: "600",
      color: pageText,
    },
  });
};
