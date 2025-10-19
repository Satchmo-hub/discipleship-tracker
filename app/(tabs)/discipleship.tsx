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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStats } from "@context/StatsContext";

const DAILY_KEY = "dt.daily";
const WEEKLY_KEY = "dt.weekly";

export default function DiscipleshipScreen() {
  const {
    stats,
    statsLoaded,
    addHealth,
    addSkill,
    incrementMorningStreak,
    incrementScriptureStreak,
  } = useStats();

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [daily, setDaily] = useState({
    morning: false,
    scripture: false,
    service: false,
  });
  const [weekly, setWeekly] = useState({
    church: false,
    mutual: false,
    temple: false,
  });

  // 🎨 Load fonts
  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        "Ringbearer-Regular": require("@assets/fonts/Ringbearer-Regular.ttf"),
        "Lora-Regular": require("@assets/fonts/Lora-Regular.ttf"),
        "Lora-Bold": require("@assets/fonts/Lora-Bold.ttf"),
        "Lora-MediumItalic": require("@assets/fonts/Lora-MediumItalic.ttf"),
      });
      setFontsLoaded(true);
    })();
  }, []);

  // 📦 Load daily/weekly completion flags
  useEffect(() => {
    (async () => {
      try {
        const savedDaily = await AsyncStorage.getItem(DAILY_KEY);
        const savedWeekly = await AsyncStorage.getItem(WEEKLY_KEY);
        if (savedDaily) setDaily(JSON.parse(savedDaily));
        if (savedWeekly) setWeekly(JSON.parse(savedWeekly));
      } catch (err) {
        console.warn("⚠️ Error loading completion flags:", err);
      }
    })();
  }, []);

  // 🧹 Auto-reset logic
  useEffect(() => {
    (async () => {
      const now = new Date();
      const lastReset = await AsyncStorage.getItem("dt.lastReset");
      const last = lastReset ? new Date(lastReset) : new Date(0);

      const needsDailyReset = now.getDate() !== last.getDate();
      const needsWeeklyReset = now.getDay() === 1 && last.getDay() !== 1; // Monday

      if (needsDailyReset) {
        setDaily({ morning: false, scripture: false, service: false });
        await AsyncStorage.setItem(
          DAILY_KEY,
          JSON.stringify({ morning: false, scripture: false, service: false })
        );
      }
      if (needsWeeklyReset) {
        setWeekly({ church: false, mutual: false, temple: false });
        await AsyncStorage.setItem(
          WEEKLY_KEY,
          JSON.stringify({ church: false, mutual: false, temple: false })
        );
      }
      await AsyncStorage.setItem("dt.lastReset", now.toISOString());
    })();
  }, []);

  // 🌀 Unified loader
  if (!fontsLoaded || !statsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a37b3f" />
        <Text style={styles.loadingText}>
          {!fontsLoaded ? "Loading assets…" : "Loading discipleship data…"}
        </Text>
      </View>
    );
  }

  // ✝️ Handlers
  const completeDaily = async (key: keyof typeof daily, callback: () => void) => {
    if (!statsLoaded || daily[key]) return;
    const updated = { ...daily, [key]: true };
    setDaily(updated);
    await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(updated));
    callback();
  };

  const completeWeekly = async (key: keyof typeof weekly, callback: () => void) => {
    if (!statsLoaded || weekly[key]) return;
    const updated = { ...weekly, [key]: true };
    setWeekly(updated);
    await AsyncStorage.setItem(WEEKLY_KEY, JSON.stringify(updated));
    callback();
  };

  // 🎯 Button functions
  const handleMorningPrayer = () =>
    completeDaily("morning", () => {
      console.log("🙏 Morning prayer logged");
      addHealth(5);
      incrementMorningStreak();
    });

  const handleScriptureStudy = () =>
    completeDaily("scripture", () => {
      console.log("📖 Scripture study logged");
      addHealth(5);
      incrementScriptureStreak();
    });

  const handleService = () =>
    completeDaily("service", () => {
      console.log("🤝 Act of service logged");
      addSkill(3);
      addHealth(2);
    });

  const handleChurchAttendance = () =>
    completeWeekly("church", () => {
      console.log("⛪ Church attendance logged");
      addSkill(10);
      addHealth(10);
    });

  const handleMutualAttendance = () =>
    completeWeekly("mutual", () => {
      console.log("🤝 Mutual attendance logged");
      addSkill(6);
      addHealth(5);
    });

  const handleTempleVisit = () =>
    completeWeekly("temple", () => {
      console.log("🏯 Temple attendance logged");
      addSkill(15);
      addHealth(10);
    });

  // 📊 Level + stats
  const level = stats?.level ?? 1;
  const levelTitle = stats?.levelTitle ?? "Sunbeam";

  // 🎨 UI
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("@assets/images/background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Discipleship Tracker</Text>
          </View>

          {/* Image */}
          <Image
            source={require("@assets/images/cleanpilgrim.png")}
            style={styles.centerImage}
            resizeMode="contain"
          />

          {/* Quote */}
          <Text style={styles.quote}>
            “A man&apos;s character is his destiny.”
          </Text>

          {/* Level */}
          <Text style={styles.level}>
            Level {level}:{" "}
            <Text style={styles.levelGlow}>{levelTitle}</Text>
          </Text>

          {/* Daily */}
          <View style={styles.categoryBox}>
            <Text style={styles.categoryTitle}>Daily Devotion</Text>

            <ActionButton
              label="☀️ Morning Prayer"
              done={daily.morning}
              onPress={handleMorningPrayer}
            />
            <ActionButton
              label="📖 Scripture Study"
              done={daily.scripture}
              onPress={handleScriptureStudy}
            />
            <ActionButton
              label="🤝 Act of Service"
              done={daily.service}
              onPress={handleService}
            />
          </View>

          {/* Weekly */}
          <View style={styles.categoryBox}>
            <Text style={styles.categoryTitle}>Weekly Commitment</Text>

            <ActionButton
              label="⛪ Attend Church"
              done={weekly.church}
              onPress={handleChurchAttendance}
            />
            <ActionButton
              label="🤝 Attend Mutual"
              done={weekly.mutual}
              onPress={handleMutualAttendance}
            />
            <ActionButton
              label="🏯 Visit the Temple"
              done={weekly.temple}
              onPress={handleTempleVisit}
            />
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

/** 🧱 Small reusable component for action buttons */
function ActionButton({ label, done, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, done && styles.actionButtonDone]}
      onPress={onPress}
      disabled={done}
    >
      <Text style={[styles.actionText, done && styles.actionTextDone]}>
        {label} {done ? "✅" : ""}
      </Text>
    </TouchableOpacity>
  );
}

/* 🎨 Styles */
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
    alignItems: "center",
    paddingVertical: 80,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 34,
    color: "#2b1d0e",
    textAlign: "center",
  },
  centerImage: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  quote: {
    fontFamily: "Lora-MediumItalic",
    fontSize: 17,
    color: "#2c2418",
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 15,
  },
  level: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#3a2c0f",
    marginBottom: 10,
  },
  levelGlow: {
    color: "#f2c94c",
    textShadowColor: "rgba(255,140,0,0.9)",
    textShadowRadius: 8,
  },
  categoryBox: {
    width: "85%",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  categoryTitle: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#2a1c0e",
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: "rgba(0, 0, 255, 0.25)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginVertical: 6,
    width: 260,
    alignItems: "center",
  },
  actionButtonDone: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  actionText: {
    fontFamily: "Lora-Bold",
    color: "#1b2230",
    fontSize: 15,
    textAlign: "center",
  },
  actionTextDone: {
    color: "#555",
    textDecorationLine: "line-through",
  },
});
