import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal</Text>

      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#EFE3D0", // parchment vibe
  },
  title: {
    fontSize: 24,
    fontFamily: "Ringbearer-Regular",
    color: "#2E2618",
    marginBottom: 20,
  },
  linkText: {
    fontFamily: "Lora-Regular",
    fontSize: 16,
    color: "#704214",
  },
});
