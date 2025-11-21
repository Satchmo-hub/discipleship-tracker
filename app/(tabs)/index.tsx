// app/(tabs)/index.tsx
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Easing } from "react-native-reanimated";
import ParchmentScreen from "../../components/ParchmentScreen";
import { useAvatar } from "../../context/AvatarContext";
import { useStats } from "../../context/StatsContext";
import { useProfile } from "../../context/ProfileContext";
import BrassNameplate from "../../components/BrassNameplate";

import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";


// === Level Title Helper ===
function getLevelTitle(level: number, gender?: string): string {
  const titlesMale = [
    "Seedling Saint","Sunbeam","Disciple","Priest","Temple Messenger","Tragdor",
    "El Jefe","Dragon Warrior","Arm of God","Runeborn Pilgrim","Elder of the North",
    "Hope of Israel","Son of Abraham","Ascendant",
  ];

  const titlesFemale = [
    "Seedling Saint","Sunbeam","Disciple","Priestess","Temple Messenger","Tragdor",
    "La Jefa","Dragon Warrior","Arm of God","Runeborn Pilgrim","Priestess of the North",
    "Hope of Israel","Daughter of Abraham","Ascendant",
  ];

  const list = gender?.toLowerCase() === "female" ? titlesFemale : titlesMale;
  const idx = Math.max(0, Math.min(level - 1, list.length - 1));
  return list[idx];
}

const avatarImages = {
  DT_SteamPunkMale: require("../../assets/avatars/DT_SteamPunkMale.png"),
  DTyoungwarriormale: require("../../assets/avatars/DTyoungwarriormale.png"),
  DTyoungwanderermale: require("../../assets/avatars/DTyoungwanderermale.png"),
  DTyoungdisciplefemale: require("../../assets/avatars/DTyoungdisciplefemale.png"),
  DTsteampunkfemale: require("../../assets/avatars/DTsteampunkfemale.png"),
  DTsheildmaidenfemale: require("../../assets/avatars/DTsheildmaidenfemale.png"),
};

export default function HomeScreen() {
  const { state } = useStats();
  const { avatar } = useAvatar();
  const { profile } = useProfile();

  const [avatarLoaded, setAvatarLoaded] = useState(false);

  if (!state || state.skillLevel === undefined) {
    return (
      <ParchmentScreen>
        <Text style={styles.loading}>Loading your stats...</Text>
      </ParchmentScreen>
    );
  }

  useEffect(() => {
    if (avatar !== null) setAvatarLoaded(true);
  }, [avatar]);

  // === Stats breakdown ===
  const level = state.skillLevel ?? 1;
  const health = state.health ?? 50;
  const coins = state.coins ?? 0;
  const gender = state.gender;
  const streaks = state.streaks ?? {};

  const title = getLevelTitle(level, gender);
  const nextTitle = getLevelTitle(level + 1, gender);

  const healthPct = Math.min(100, Math.round(health));
  const levelProgress = Math.min(100, Math.round((health / 98) * 100));

  const readingStreak = streaks.scripture ?? 0;
  const morningStreak = streaks.morningPrayer ?? 0;
  const eveningStreak = streaks.eveningPrayer ?? 0;

  const selectedAvatar =
    avatarImages[avatar] ?? require("../../assets/images/cleanpilgrim.png");

  // === Avatar gestures ===
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 250 });
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // === Badge tap animations ===
  const coinScale = useSharedValue(1);
  const dominusScale = useSharedValue(1);

  const coinAnim = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));

  const dominusAnim = useAnimatedStyle(() => ({
    transform: [{ scale: dominusScale.value }],
  }));

  const grow = (sv) => {
    sv.value = withSpring(1.17, { damping: 7, stiffness: 150 });
  };
  const shrink = (sv) => {
    sv.value = withSpring(1, { damping: 8, stiffness: 160 });
  };

  const firstName = profile?.first_name ?? null;

  return (
    <ParchmentScreen safeTopPadding>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* === Top icon + title === */}
        <View style={styles.topSection}>
          <MotiView
            from={{ scale: 0.96, opacity: 0.92 }}
            animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.92, 1, 0.92] }}
            transition={{
              type: "timing",
              duration: 2500,
              loop: true,
              easing: Easing.inOut(Easing.ease),
            }}
            style={styles.cogWrapper}
          >
            <Image
              source={require("../../assets/images/tab_home.png")}
              style={styles.homeTabIcon}
              resizeMode="contain"
            />
          </MotiView>
          <Text style={styles.title}>Home Screen</Text>
        </View>

        {/* === Avatar === */}
        <View style={styles.avatarFrame}>
          <View style={styles.metalFrame}>
            <GestureHandlerRootView style={styles.avatarGesture}>
              <GestureDetector gesture={combinedGesture}>
                <Animated.Image
                  source={selectedAvatar}
                  style={[styles.avatar, animatedStyle]}
                  resizeMode="contain"
                />
              </GestureDetector>
            </GestureHandlerRootView>
          </View>
        </View>

        {/* === Username === */}
        {firstName && <Text style={styles.userNameOnly}>{firstName}</Text>}

        {/* === Level titles === */}
        <View style={styles.levelBlock}>
          <Text style={styles.levelText}>
            Level {level}: <Text style={styles.currentTitle}>{title}</Text>
          </Text>
          <Text style={styles.levelText}>
            Next: <Text style={styles.nextTitle}>{nextTitle}</Text>
          </Text>
        </View>

        {/* === Stats === */}
        <Text style={styles.sectionHeader}>Stats</Text>
        <View style={styles.statsSection}>
          <Bar label="Health" value={healthPct} color="#8A1F1F" />
          <Bar label="Skill / Next Level" value={levelProgress} color="#0A4F2C" />

          {/* === Coins === */}
          <Pressable
            onPressIn={() => grow(coinScale)}
            onPressOut={() => shrink(coinScale)}
            style={{ alignItems: "center" }}
          >
            <Animated.View style={coinAnim}>
              <Image
                source={require("../../assets/images/coins.png")}
                style={styles.coinIcon}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.coinText}>{coins}</Text>
          </Pressable>
        </View>

        {/* === Dominus Badge === */}
        <Pressable
          onPressIn={() => grow(dominusScale)}
          onPressOut={() => shrink(dominusScale)}
          style={{ alignItems: "center", marginTop: 12 }}
        >
          <Animated.View style={dominusAnim}>
            <Image
              source={require("../../assets/images/godloveseffort.png")}
              style={styles.dominusBadge}
              resizeMode="contain"
            />
          </Animated.View>
        </Pressable>

        {/* === Streak Plates === */}
        <View style={styles.streakSection}>
          <BrassNameplate title="Scripture Study" value={`${readingStreak} days`} />
          <BrassNameplate title="Nightly Prayer" value={`${eveningStreak} days`} />
          <BrassNameplate title="Morning Prayer" value={`${morningStreak} days`} />
        </View>

      </ScrollView>
    </ParchmentScreen>
  );
}

// === Progress Bar ===
function Bar({ label, value, color }) {
  return (
    <View style={styles.barWrapper}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barOutline}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}%</Text>
    </View>
  );
}

// === Styles ===
const styles = StyleSheet.create({
// ⭐ Your entire original styles object stays unchanged
  scroll: {
    paddingBottom: 130,
    alignItems: "center",
  },

  loading: {
    fontFamily: "Lora-Regular",
    fontSize: 20,
    color: "#2e2618",
    textAlign: "center",
    marginTop: 40,
  },

  topSection: { alignItems: "center", marginTop: 12 },

  cogWrapper: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f9e6b5",
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },

  homeTabIcon: { width: 95, height: 95 },

  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 28,
    color: "#2e2618",
    marginTop: -2,
  },

  avatarFrame: { marginTop: 16, marginBottom: 10 },

  metalFrame: {
    width: 176,
    height: 210,
    padding: 6,
    borderRadius: 16,
    borderWidth: 3.5,
    borderColor: "#4b3b28",
    backgroundColor: "rgba(105,89,65,0.25)",
    shadowColor: "#2e2618",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 3, height: 3 },
    justifyContent: "center",
    alignItems: "center",
  },

  avatarGesture: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  userNameOnly: {
    fontFamily: "Lora-MediumItalic",
    fontSize: 26,
    color: "#FFD700",
    textShadowColor: "#9C6E00",
    textShadowRadius: 5,
    textShadowOffset: { width: 1, height: 1 },
    marginBottom: 12,
    textAlign: "center",
  },

  levelBlock: { alignItems: "center", marginBottom: 14 },

  levelText: {
    fontFamily: "Lora-Regular",
    fontSize: 18,
    color: "#2e2618",
  },

  currentTitle: { color: "#04783C", fontFamily: "Lora-MediumItalic" },
  nextTitle: { color: "#FFD700", fontFamily: "Lora-MediumItalic" },

  sectionHeader: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 26,
    color: "#2e2618",
    marginVertical: 14,
    textAlign: "center",
  },

  statsSection: { width: "100%", alignItems: "center" },

  barWrapper: { width: "75%", marginVertical: 6 },

  barLabel: {
    fontFamily: "Lora-Regular",
    fontSize: 14,
    color: "#2e2618",
    textAlign: "center",
  },

  barOutline: {
    height: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#7a5b33",
    backgroundColor: "rgba(255,255,255,0.45)",
    overflow: "hidden",
    marginVertical: 2,
  },

  barFill: { height: "100%", borderRadius: 8 },

  barValue: {
    fontFamily: "Lora-Regular",
    fontSize: 12,
    textAlign: "center",
    color: "#2e2618",
  },

  coinIcon: {
    width: 120,
    height: 120,
    marginBottom: -6,
  },

  coinText: {
    fontFamily: "Lora-Bold",
    fontSize: 34,
    color: "#2e2618",
    textAlign: "center",
    marginTop: 0,
  },

  dominusBadge: {
    width: 140,
    height: 140,
    marginTop: 4,
  },

  streakSection: {
    width: "100%",
    marginTop: 26,
    paddingHorizontal: 12,
    alignItems: "stretch",
    justifyContent: "center",
  },
});
