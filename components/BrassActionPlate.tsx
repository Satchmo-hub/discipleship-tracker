// components/BrassActionPlate.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";

type PlateMode = "daily" | "weekly" | "kindness";

type Props = {
  label: string;
  done: boolean;       // For daily/weekly
  onPress: () => void;
  mode: PlateMode;
  sleepMode?: boolean;
  count?: number;      // Global kindness count
};

export default function BrassActionPlate({
  label,
  done,
  onPress,
  mode,
  sleepMode = false,
  count = 0,
}: Props) {
  const zzAnim = useRef(new Animated.Value(0)).current;
  const zzLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const [soundLoaded, setSoundLoaded] = useState(false);

  // ------------------------------------------------------------
  // Load steam sound
  // ------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/steam.wav")
        );

        if (isMounted) {
          soundRef.current = sound;
          setSoundLoaded(true);
        }
      } catch (err) {
        console.warn("Steam sound load error:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
      if (zzLoopRef.current) zzLoopRef.current.stop();
    };
  }, []);

  const playSteam = useCallback(async () => {
    try {
      if (!soundLoaded || !soundRef.current) return;
      await soundRef.current.stopAsync();
      await soundRef.current.playAsync();
    } catch (err) {
      console.warn("Steam play error:", err);
    }
  }, [soundLoaded]);

  // ------------------------------------------------------------
  // Zzz animation (Sleep mode)
  // ------------------------------------------------------------
  const startZzz = useCallback(() => {
    if (zzLoopRef.current) return;

    zzLoopRef.current = Animated.loop(
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
    );

    zzLoopRef.current.start();
  }, [zzAnim]);

  const stopZzz = useCallback(() => {
    if (zzLoopRef.current) {
      zzLoopRef.current.stop();
      zzLoopRef.current = null;
    }
    zzAnim.setValue(0);
  }, [zzAnim]);

  useEffect(() => {
    if (!sleepMode || !done) stopZzz();
  }, [done, sleepMode, stopZzz]);

  // ------------------------------------------------------------
  // Press logic
  // ------------------------------------------------------------
  const handlePress = useCallback(() => {
    // For kindness, block if reached 5
    if (mode === "kindness" && count >= 5) return;

    playSteam();

    if (!done || mode === "kindness") {
      onPress();
      if (sleepMode && !done) startZzz();
    }
  }, [done, onPress, playSteam, sleepMode, startZzz, mode, count]);

  // ------------------------------------------------------------
  // Capsule color per mode
  // ------------------------------------------------------------
  const capsuleColor =
    mode === "weekly"
      ? "rgba(0,120,50,0.55)"
      : mode === "kindness"
      ? "rgba(120,0,40,0.55)"  // deep red capsule
      : "rgba(40,30,10,0.55)"; // daily

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
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
          {/* LABEL */}
          <Text style={styles.title} numberOfLines={1}>
            {sleepMode && done ? "Now Sleeping..." : label}
          </Text>

          {/* CAPSULE ON THE RIGHT */}
          <View style={[styles.capsule, { backgroundColor: capsuleColor }]}>
            {mode === "kindness" ? (
              <Text style={styles.countText}>{count}</Text>
            ) : done ? (
              <Text style={styles.engravedCheck}>✓</Text>
            ) : (
              <Text style={styles.empty}> </Text>
            )}
          </View>
        </View>

        {/* Zzz animation */}
        {sleepMode && done && (
          <Animated.Text
            style={[styles.zzz, { transform: [{ translateY: zzAnim }] }]}
          >
            zzz
          </Animated.Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------
const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
  },

  plate: {
    width: "82%",
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
  },

  title: {
    fontFamily: "Lora-Regular",
    fontSize: 17,
    color: "#2e2618",
    flex: 1,
    letterSpacing: 0.4,
    textShadowColor: "#e9d59b",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  capsule: {
    width: 30,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d9c07a",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },

  countText: {
    fontFamily: "Lora-Bold",
    fontSize: 14,
    color: "#fefae7",
    textAlign: "center",
  },

  empty: {
    fontSize: 16,
  },

  engravedCheck: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#f5eac7",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  zzz: {
    position: "absolute",
    bottom: -6,
    right: 14,
    color: "#3a2c1b",
    fontFamily: "Lora-Regular",
    fontSize: 16,
  },

  rivet: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5c4521",
    borderWidth: 1.3,
    borderColor: "#e0c97a",
  },

  topLeft: { top: 6, left: 6 },
  topRight: { top: 6, right: 6 },
  bottomLeft: { bottom: 6, left: 6 },
  bottomRight: { bottom: 6, right: 6 },
});
