import React, { useEffect } from "react";
import { Animated, Easing, Image } from "react-native";

export default function BouncyIcon({ source, shouldBounce, size = 52 }) {
  const scale = new Animated.Value(1);

  useEffect(() => {
    if (!shouldBounce) {
      scale.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [shouldBounce]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
