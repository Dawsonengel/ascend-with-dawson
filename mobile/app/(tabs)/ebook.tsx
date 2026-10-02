import { useEffect, useRef } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { useMembership } from "@/context/MembershipContext";

const webPdf = "/ebook.pdf";

const mobilePdf =
  "https://docs.google.com/gview?embedded=true&url=https://raw.githubusercontent.com/Dawsonengel/ascend-with-dawson/main/Ebook%20finished%20.pdf&zoom=page-width";

export default function EbookScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { hasPremiumAccess } = useMembership();
  const isLocked = !hasPremiumAccess;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const pdfView =
    Platform.OS === "web" ? (
      <iframe
        src={webPdf}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: 16,
          filter: isLocked ? "blur(2.5px)" : "none",
        }}
      />
    ) : (
      <WebView
        source={{ uri: mobilePdf }}
        style={[styles.webview, isLocked && styles.lockedMobilePreview]}
        scrollEnabled={!isLocked}
      />
    );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Ascend: The Framework</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MEMBERS ONLY</Text>
        </View>
      </View>
      <View style={styles.divider} />

      <Animated.View style={[styles.viewerContainer, { opacity: fadeAnim }]}>
        {pdfView}
        {isLocked ? (
          <View style={styles.lockOverlay}>
            <MaterialIcons name="lock" size={22} color="#111" />
            <Text style={styles.lockTitle}>Preview: First Page</Text>
            <Pressable style={styles.unlockButton} onPress={() => router.push("/store")}>
              <Text style={styles.unlockButtonText}>Unlock Full Access</Text>
            </Pressable>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    paddingTop: 70,
    paddingBottom: 10,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
  },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(17, 24, 39, 0.12)",
    marginHorizontal: 24,
    marginBottom: 10,
  },
  viewerContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  webview: {
    flex: 1,
  },
  lockedMobilePreview: {
    opacity: 0.5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(243, 244, 246, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  lockTitle: {
    color: "#111",
    fontSize: 16,
    fontWeight: "700",
  },
  unlockButton: {
    marginTop: 4,
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
