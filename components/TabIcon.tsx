// components/TabIcon.tsx
import React, { useEffect } from "react";
import { Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

type Props = {
  focused: boolean;
  source: any;
  bounce?: boolean;
};

export default function TabIcon({ focused, source, bounce }: Props) {
  const offset = useSharedValue(0);

  useEffect(() => {
    if (bounce) {
      // Continuous gentle bobbing
      offset.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      // Stop animation smoothly
      offset.value = withTiming(0, { duration: 250 });
    }
  }, [bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[
        { justifyContent: "center", alignItems: "center" },
        animatedStyle,
      ]}
    >
      <Image
        source={source}
        style={{
          width: focused ? 60 : 52,
          height: focused ? 60 : 52,
          marginTop: 8,
          marginBottom: -6,
          opacity: focused ? 1 : 0.9,
        }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
