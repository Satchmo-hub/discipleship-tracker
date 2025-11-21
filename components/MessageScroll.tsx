import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  withRepeat,
} from "react-native-reanimated";

type Props = {
  message: string;
  title?: string;
  timestamp?: string;
  icon?: any;
  initialOpen?: boolean;
  isUnread?: boolean;
  onOpen?: () => void; // marks as read
};

export default function MessageScroll({
  message,
  title,
  timestamp,
  icon,
  initialOpen = false,
  isUnread = false,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(initialOpen);

  // Controls the scroll unrolling
  const progress = useSharedValue(initialOpen ? 1 : 0);

  // Controls the read/unread dimming
  const opacity = useSharedValue(isUnread ? 1 : 0.65);

  // Controls bobbing animation for unread items
  const bounce = useSharedValue(0);

  // When unread, start bounce
  useEffect(() => {
    if (isUnread) {
      bounce.value = withRepeat(
        withTiming(-6, {
          duration: 600,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );
    } else {
      bounce.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isUnread]);

  const handlePress = () => {
    const newState = !open;
    setOpen(newState);

    // Scroll open/close animation
    progress.value = withTiming(newState ? 1 : 0, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });

    if (newState) {
      // Opening: always brighten to full opacity
      opacity.value = withTiming(1, { duration: 300 });
      if (isUnread && onOpen) onOpen();
    } else {
      // Closing: dim if already read
      if (!isUnread) {
        opacity.value = withTiming(0.65, { duration: 300 });
      }
    }
  };

  // Animated unrolling height
  const scrollAnimatedStyle = useAnimatedStyle(() => ({
    height: progress.value * 140,
    opacity: progress.value,
  }));

  // Animated bobbing
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      {/* Rolled Scroll Icon */}
      <Pressable onPress={handlePress} style={styles.iconWrapper}>
        <Animated.View style={iconAnimatedStyle}>
          <Image
            source={
              icon || require("../assets/images/rolledScroll.png")
            }
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>

      {/* Unrolled Scroll Content */}
      <Animated.View style={[styles.scrollContainer, scrollAnimatedStyle]}>
        <View style={styles.innerScroll}>
          {title && <Text style={styles.title}>{title}</Text>}

          <Text style={styles.message}>{message}</Text>

          {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },

  iconWrapper: {
    padding: 10,
  },

  icon: {
    width: 105, // 50% larger
    height: 105,
  },

  scrollContainer: {
    width: "88%",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#f6ecd5",
    borderWidth: 2,
    borderColor: "#d0c2a4",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  innerScroll: {
    padding: 15,
  },

  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 20,
    marginBottom: 6,
    color: "#4b3a25",
  },

  message: {
    fontFamily: "Lora-Regular",
    fontSize: 16,
    color: "#4b3a25",
    marginBottom: 8,
  },

  timestamp: {
    fontFamily: "Lora-Italic",
    fontSize: 12,
    color: "#6a5a43",
    marginTop: 4,
    textAlign: "right",
  },
});
