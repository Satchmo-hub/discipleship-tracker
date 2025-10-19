import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { useStats } from "@context/StatsContext";

export default function StatsScreen() {
  const { stats } = useStats();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Ringbearer-Regular": require("@assets/fonts/Ringbearer-Regular.ttf"),
        "Lora-Regular": require("@assets/fonts/Lora-Regular.ttf"),
        "Lora-Bold": require("@assets/fonts/Lora-Bold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a37b3f" />
        <Text style={styles.loadingText}>Loading assets…</Text>
      </View>
    );
  }

  const healthPct = Math.min(stats.health, 100);
  const skillPct = Math.min(stats.skill, 100);

  // 🧮 Determine next level title
  const nextLevelTitle = (() => {
    const titles = [
      "Seedling Saint",
      "Sunbeam",
      "Temple Messenger",
      stats.gender === "male" ? "Priest" : "Priestess",
      "Disciple",
      "Saint",
      "Arm of God",
      "El Jefe",
      "Trogdor",
      "Hope of Israel",
      "Advocate",
      "Dragon Warrior",
      stats.gender === "male" ? "Son of Abraham" : "Daughter of Abraham",
    ];
    return titles[stats.level] || "Exalted";
  })();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Your Progress</Text>

          {/* Health Bar */}
          <Text style={styles.label}>Health Status</Text>
          <View style={styles.barOuter}>
            <View style={[styles.healthBar, { width: `${healthPct}%` }]} />
          </View>
          <Text style={styles.value}>{healthPct.toFixed(0)}%</Text>

          {/* Skill Bar */}
          <Text style={[styles.label, { marginTop: 20 }]}>Skill Progression</Text>
          <View style={styles.barOuter}>
            <View style={[styles.skillBar, { width: `${skillPct}%` }]} />
          </View>
          <Text style={styles.value}>{skillPct.toFixed(0)} / 100 points</Text>

          {/* Level Info */}
          <View style={styles.levelContainer}>
            <Text style={styles.currentLevel}>
              Level {stats.level}: {stats.levelTitle}
            </Text>
            <Text style={styles.nextLevel}>
              Next Level:{" "}
              <Text style={styles.nextLevelName}>{nextLevelTitle}</Text>
            </Text>
          </View>

          {/* Coins */}
          <View style={styles.coinRow}>
            <Image
              source={require("@assets/images/coinbag.png")}
              style={styles.coinIcon}
              resizeMode="contain"
            />
            <Text style={styles.coinLabel}>Coins: </Text>
            <Text style={styles.coinValue}>{stats.coins ?? 0}</Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 32,
    color: "#2b1d0e",
    marginBottom: 30,
  },
  label: {
    fontFamily: "Lora-Bold",
    color: "#3a2c0f",
    alignSelf: "flex-start",
  },
  barOuter: {
    height: 18,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 5,
  },
  healthBar: {
    height: "100%",
    backgroundColor: "#b30000", // darker red
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  skillBar: {
    height: "100%",
    backgroundColor: "green",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  value: {
    fontFamily: "Lora-Regular",
    fontSize: 14,
    color: "#3a2c0f",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  levelContainer: {
    width: "100%",
    marginTop: 25,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  currentLevel: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#1f1408",
  },
  nextLevel: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#1f1408",
    marginTop: 4,
  },
  nextLevelName: {
    color: "#007f5f", // emerald green
    textDecorationLine: "underline", // underline only level name
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
  },
  coinIcon: { width: 60, height: 60, marginRight: 10 },
  coinLabel: {
    fontFamily: "Lora-Bold",
    color: "#3a2c0f",
    fontSize: 18,
  },
  coinValue: {
    fontFamily: "Lora-Bold",
    color: "#a37b3f",
    fontSize: 20,
  },
});
