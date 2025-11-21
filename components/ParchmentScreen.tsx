// components/ParchmentScreen.tsx
import React from "react";
import { ImageBackground, StyleSheet, ScrollView } from "react-native";

const bg = require("../assets/images/background.jpg");

type Props = {
  children: React.ReactNode;
  safeTopPadding?: boolean;
};

export default function ParchmentScreen({ children, safeTopPadding = false }: Props) {
  return (
    <ImageBackground source={bg} style={styles.full} resizeMode="cover">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.inner,
          safeTopPadding ? { paddingTop: 12 } : null,
          { paddingBottom: 160 },
        ]}
      >
        {children}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  inner: {
    flexGrow: 1,
    alignItems: "stretch",   // ⭐ FIXED — allows FULL WIDTH plates
    backgroundColor: "transparent",
  },
});
