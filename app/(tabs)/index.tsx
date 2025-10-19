// app/(tabs)/index.tsx
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
import { useStats } from "@context/StatsContext"; // ✅ alias

export default function HomeScreen() {
  const { stats, statsLoaded } = useStats();
  const [fontsLoaded, setFontsLoaded] = useState(false);

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
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Discipleship Tracker</Text>
          </View>
          <Image
            source={require("@assets/images/cleanpilgrim.png")}
            style={styles.centerImage}
            resizeMode="contain"
          />
          <Text style={styles.quote}>“A man&apos;s character is his destiny.”</Text>
          <View style={styles.section}>
            <Text style={styles.level}>
              Level {level}:{" "}
              <Text style={styles.levelGlow}>{levelTitle}</Text>
            </Text>
            <TouchableOpacity style={styles.streakButton}>
              <Text style={styles.streakText}>
                🔥 Morning Prayer Streak: {morningStreak} days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.streakButton}>
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

// ⬇ same styles as before (unchanged)
const styles = StyleSheet.create({
  /* keep your full style object unchanged */
});
