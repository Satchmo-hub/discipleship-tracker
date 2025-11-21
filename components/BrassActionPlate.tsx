import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type PlateMode = "daily" | "weekly" | "kindness";

type Props = {
  label: string;
  done: boolean;
  onPress: () => void;
  mode: PlateMode;
  sleepMode?: boolean;
};

export default function BrassActionPlate({
  label,
  done,
  onPress,
  mode,
  sleepMode = false,
}: Props) {
  const [zzAnim] = useState(new Animated.Value(0));
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/steam.wav")
        );

        if (mounted) setSound(sound);
      } catch (err) {
        console.warn("Steam sound load error:", err);
      }
    })();

    return () => {
      mounted = false;
      if (sound) sound.unloadAsync();
    };
  }, []);

  const playSteam = async () => {
    try {
      if (!sound) return;
      await sound.stopAsync();
      await sound.playAsync();
    } catch (err) {
      console.warn("Steam play error:", err);
    }
  };

  const startZzz = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(zzAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(zzAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handlePress = () => {
    playSteam();
    if (!done) {
      onPress();
      if (sleepMode) startZzz();
    }
  };

  const capsuleColor =
    mode === "weekly"
      ? "rgba(0,120,50,0.55)"
      : mode === "kindness"
      ? "rgba(120,0,40,0.55)"
      : "rgba(40,30,10,0.55)";

  return (
    <Pressable onPress={handlePress} style={styles.wrapper}>
      <LinearGradient
        colors={["#b7965a", "#cfae64", "#a67c37"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.plate}
      >
        {/* Rivets */}
        <View style={[styles.rivet, styles.topLeft]} />
        <View style={[styles.rivet, styles.topRight]} />
        <View style={[styles.rivet, styles.bottomLeft]} />
        <View style={[styles.rivet, styles.bottomRight]} />

        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {sleepMode && done ? "Now Sleeping..." : label}
          </Text>

          <View style={[styles.capsule, { backgroundColor: capsuleColor }]}>
            {done ? (
              <Text style={styles.engravedCheck}>✓</Text>
            ) : (
              <Text style={styles.empty}> </Text>
            )}
          </View>
        </View>

        {sleepMode && done && (
          <Animated.Text
            style={[
              styles.zzz,
              {
                transform: [{ translateY: zzAnim }],
              },
            ]}
          >
            zzz
          </Animated.Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },

  plate: {
    width: "82%",   // ⭐ UPDATED — prevents truncation on all devices
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#6d552a",
    marginVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",

    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },

  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  title: {
    fontFamily: "Lora-Regular",
    fontSize: 17,
    color: "#2e2618",

    flex: 1,          // ⭐ no truncation + predictable width
    paddingRight: 12, // ⭐ Option B spacing

    letterSpacing: 0.4,
    textShadowColor: "#e9d59b",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  capsule: {
    width: 48,        // ⭐ fixed width capsule
    minHeight: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d9c07a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,

    marginLeft: 14,  // ⭐ spacing from text

    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },

  empty: {
    fontSize: 16,
  },

  engravedCheck: {
    fontFamily: "Lora-Bold",
    fontSize: 20,
    color: "#f5eac7",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  rivet: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#5c4521",
    borderWidth: 1,
    borderColor: "#e0c97a",
  },

  topLeft: { top: 5, left: 7 },
  topRight: { top: 5, right: 7 },
  bottomLeft: { bottom: 5, left: 7 },
  bottomRight: { bottom: 5, right: 7 },

  zzz: {
    position: "absolute",
    right: 20,
    top: -8,
    fontSize: 14,
    color: "#2e2618",
    opacity: 0.8,
    fontFamily: "Lora-MediumItalic",
  },
});
