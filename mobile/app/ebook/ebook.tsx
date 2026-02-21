import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const rawPdf =
  "https://raw.githubusercontent.com/Dawsonengel/ascend-with-dawson/main/Ebook%20finished%20.pdf";

export default function EbookScreen() {
  if (Platform.OS === "web") {
    return (
      <iframe
        src={rawPdf}
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView source={{ uri: rawPdf }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});