import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

type Props = {
  message: string;
  onHide: () => void;
};

export default function ToastSteampunk({ message, onHide }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    // Slide / fade in
    opacity.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });

    // Auto-hide after 3 seconds
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 350 });
      translateY.value = withTiming(30, { duration: 350 });
      setTimeout(onHide, 350);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.toast, animatedStyles]}>
      <View style={styles.inner}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    zIndex: 9999,
  },
  inner: {
    backgroundColor: "#f6ecd5", // parchment tone
    borderWidth: 2,
    borderColor: "#b89c68", // brass-ish
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    fontFamily: "Lora-Bold",
    fontSize: 16,
    color: "#4b3a25",
  },
});
