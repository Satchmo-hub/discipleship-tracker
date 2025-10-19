import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { useStats } from "@context/StatsContext";

export default function HomeScreen() {
  const { stats, statsLoaded } = useStats();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // 🎨 Load fonts once
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Ringbearer-Regular": require("@assets/fonts/Ringbearer-Regular.ttf"),
        "Lora-Regular": require("@assets/fonts/Lora-Regular.ttf"),
        "Lora-Bold": require("@assets/fonts/Lora-Bold.ttf"),
        "Lora-MediumItalic": require("@assets/fonts/Lora-MediumItalic.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 🌀 Show unified loader until BOTH fonts and stats are ready
  if (!fontsLoaded || !statsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a37b3f" />
        <Text style={styles.loadingText}>
          {!fontsLoaded
            ? "Loading assets…"
            : "Loading discipleship data…"}
        </Text>
      </View>
    );
  }

  // ✅ Safe to use stats now
  const level = stats?.level ?? 1;
  const levelTitle = stats?.levelTitle ?? "Sunbeam";
  const morningStreak = stats?.morningStreak ?? 0;
  const scriptureStreak = stats?.scriptureStreak ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Discipleship Tracker</Text>
          </View>

          {/* Center Image */}
          <Image
            source={require("@assets/images/cleanpilgrim.png")}
            style={styles.centerImage}
            resizeMode="contain"
          />

          {/* Quote */}
          <Text style={styles.quote}>
            “A man&apos;s character is his destiny.”
          </Text>

          {/* Level and Streak Buttons */}
          <View style={styles.section}>
            <Text style={styles.level}>
              Level {level}:{" "}
              <Text style={styles.levelGlow}>{levelTitle}</Text>
            </Text>

            <TouchableOpacity style={styles.streakButton} disabled={!statsLoaded}>
              <Text style={styles.streakText}>
                🔥 Morning Prayer Streak: {morningStreak} days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.streakButton} disabled={!statsLoaded}>
              <Text style={styles.streakText}>
                📖 Scripture Study Streak: {scriptureStreak} days
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f4ecd8",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Lora-Regular",
    color: "#3a2e1a",
    marginTop: 10,
    fontSize: 16,
  },
  container: { flex: 1 },
  background: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 100,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 36,
    color: "#2b1d0e",
    textAlign: "center",
  },
  centerImage: {
    width: 220,
    height: 220,
    marginTop: 10,
    marginBottom: 10,
  },
  quote: {
    fontFamily: "Lora-MediumItalic",
    fontSize: 17,
    color: "#2c2418",
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 15,
  },
  section: {
    alignItems: "center",
    marginTop: 0,
  },
  level: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#3a2c0f",
    marginBottom: 18,
  },
  levelGlow: {
    color: "#f2c94c",
    textShadowColor: "rgba(255,140,0,0.9)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  streakButton: {
    backgroundColor: "rgba(0, 0, 255, 0.25)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 6,
    width: 260,
    alignItems: "center",
  },
  streakText: {
    fontFamily: "Lora-Bold",
    color: "#1b2230",
    fontSize: 15,
    textAlign: "center",
  },
});
