import { Platform, StyleSheet, Text, View } from "react-native";

export default function InstallWebAppCard() {
  const maybeNavigator = typeof navigator === "undefined" ? undefined : navigator;
  const shouldShow = Platform.OS === "web" && !(maybeNavigator as any)?.standalone;

  if (!shouldShow) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Install App</Text>
      <Text style={styles.body}>Debug mount: InstallWebAppCard is rendering.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    marginTop: 4,
    color: "rgba(248,250,252,0.82)",
    fontSize: 12,
  },
});
