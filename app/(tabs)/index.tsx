// ============================================================
// HomeScreen with SECRET GODMODE UNLOCK BAR
// Minimal, hidden admin backdoor under Streak Plates
// ============================================================

import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import BrassNameplate from "../../components/BrassNameplate";
import ParchmentScreen from "../../components/ParchmentScreen";

import { useAvatar } from "../../context/AvatarContext";
import { useProfile } from "../../context/ProfileContext";
import { useStats } from "../../context/StatsContext";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase/client";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

// ============================================================
// LEVEL TITLE HELPER
// ============================================================
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

// ============================================================
// AVATAR IMAGES
// ============================================================
const avatarImages = {
  DT_SteamPunkMale: require("../../assets/avatars/DT_SteamPunkMale.png"),
  DTyoungwarriormale: require("../../assets/avatars/DTyoungwarriormale.png"),
  DTyoungwanderermale: require("../../assets/avatars/DTyoungwanderermale.png"),
  DTyoungdisciplefemale: require("../../assets/avatars/DTyoungdisciplefemale.png"),
  DTsteampunkfemale: require("../../assets/avatars/DTsteampunkfemale.png"),
  DTsheildmaidenfemale: require("../../assets/avatars/DTsheildmaidenfemale.png"),
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function HomeScreen() {
  const { state } = useStats();
  const { avatar } = useAvatar();
  const { profile, refreshProfile } = useProfile();

  const MR_C_UUID = "ad32f222-6f49-4ec9-884a-2ba66afd8336";

  const isTeacher =
    profile?.uuid === MR_C_UUID ||
    !!profile?.teacher_id ||
    profile?.teacher_code === "GODmode-2025";

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

  // ============================================================
  // SECRET GOD MODE INPUT BAR
  // ============================================================
  const [godCode, setGodCode] = useState("");
  const ACCESS_CODE = "GODmode-2025";

  const shouldShowSecretBar =
    !isTeacher && profile?.uuid !== MR_C_UUID;

  const unlockGodMode = async () => {
    if (godCode.trim() !== ACCESS_CODE) {
      Alert.alert("Incorrect code", "Access denied.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ teacher_code: ACCESS_CODE })
      .eq("uuid", profile.uuid);

    if (error) {
      Alert.alert("Error", "Could not activate God Mode.");
      return;
    }

    setGodCode("");
    await refreshProfile();
    Alert.alert("God Mode Activated", "Teacher tools unlocked.");
  };

  // ============================================================
  // AVATAR GESTURES
  // ============================================================
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => { scale.value = e.scale; })
    .onEnd(() => { scale.value = withTiming(1, { duration: 250 }); });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
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

  // ============================================================
  // LOGOUT / ERASE
  // ============================================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    Alert.alert("Logged Out", "Your session has ended.");
  };

  const handleEraseAll = async () => {
    Alert.alert(
      "Erase All Data",
      "This will delete all local data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            await supabase.auth.signOut();
            Alert.alert("Done", "All local data erased.");
          },
        },
      ]
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <ParchmentScreen safeTopPadding>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Top icon + title */}
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

        {/* Avatar */}
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

        {/* Username */}
        {profile?.first_name && (
          <Text style={styles.userNameOnly}>{profile.first_name}</Text>
        )}

        {/* Level Titles */}
        <View style={styles.levelBlock}>
          <Text style={styles.levelText}>
            Level {level}: <Text style={styles.currentTitle}>{title}</Text>
          </Text>
          <Text style={styles.levelText}>
            Next: <Text style={styles.nextTitle}>{nextTitle}</Text>
          </Text>
        </View>

        {/* Stats */}
        <Text style={styles.sectionHeader}>Stats</Text>

        <View style={styles.statsSection}>
          <Bar label="Health" value={healthPct} color="#8A1F1F" />
          <Bar label="Skill / Next Level" value={levelProgress} color="#0A4F2C" />

          {/* Coins */}
          <Pressable style={{ alignItems: "center" }}>
            <Image
              source={require("../../assets/images/coins.png")}
              style={styles.coinIcon}
              resizeMode="contain"
            />
            <Text style={styles.coinText}>{coins}</Text>
          </Pressable>
        </View>

        {/* Dominus Badge */}
        <Image
          source={require("../../assets/images/godloveseffort.png")}
          style={styles.dominusBadge}
          resizeMode="contain"
        />

        {/* Streaks */}
        <View style={styles.streakSection}>
          <BrassNameplate title="Scripture Study" value={`${readingStreak} days`} />
          <BrassNameplate title="Nightly Prayer" value={`${eveningStreak} days`} />
          <BrassNameplate title="Morning Prayer" value={`${morningStreak} days`} />
        </View>

        {/* ============================================================
            SECRET GOD MODE UNLOCK BAR
        ============================================================ */}
        {shouldShowSecretBar && (
          <View style={styles.secretBar}>
            <TextInput
              placeholder="Enter code..."
              placeholderTextColor="#cfae64"
              value={godCode}
              onChangeText={setGodCode}
              style={styles.secretInput}
            />
            <TouchableOpacity style={styles.secretButton} onPress={unlockGodMode}>
              <Text style={styles.secretButtonText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout / Erase */}
        <View style={{ marginTop: 40, marginBottom: 80, alignItems: "center" }}>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ fontSize: 18, color: "#2e2618", marginBottom: 12 }}>
              Log Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEraseAll}>
            <Text style={{ fontSize: 18, color: "#8A1F1F" }}>
              Erase All Data
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ParchmentScreen>
  );
}

// ============================================================
// PROGRESS BAR
// ============================================================
function Bar({ label, value, color }) {
  return (
    <View style={styles.barWrapper}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barOutline}>
        <View
          style={[
            styles.barFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.barValue}>{value}%</Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
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

  avatarGesture: { width: "100%", height: "100%" },

  avatar: { width: "100%", height: "100%", borderRadius: 10 },

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

  coinIcon: { width: 120, height: 120, marginBottom: -6 },

  coinText: {
    fontFamily: "Lora-Bold",
    fontSize: 34,
    color: "#2e2618",
    textAlign: "center",
  },

  dominusBadge: { width: 140, height: 140, marginTop: 4 },

  streakSection: {
    width: "100%",
    marginTop: 26,
    paddingHorizontal: 12,
    alignItems: "stretch",
  },

  // ============================================================
  // SECRET GOD MODE UNLOCK BAR
  // ============================================================
  secretBar: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
    width: "80%",
    borderWidth: 1.5,
    borderColor: "#cfae64",
    borderRadius: 10,
    backgroundColor: "rgba(59,47,31,0.35)",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  secretInput: {
    flex: 1,
    fontFamily: "Lora-Regular",
    color: "#f5e7c3",
    paddingVertical: 6,
    fontSize: 16,
  },

  secretButton: {
    marginLeft: 10,
    backgroundColor: "#a78a57",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  secretButtonText: {
    color: "white",
    fontFamily: "Lora-Bold",
    fontSize: 14,
  },
});
