import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <View style={styles.separator} />
      <Text>This is the modal screen.</Text>

      {/* Light status bar for iOS */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: "80%",
    backgroundColor: "#ccc",
  },
});
