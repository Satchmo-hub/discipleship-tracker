// app/_layout.tsx
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";

import { initNotificationChannels } from "../lib/reminders";

import { StatsProvider } from "../context/StatsContext";
import { AvatarProvider } from "../context/AvatarContext";
import { ProfileProvider } from "../context/ProfileContext";
import { ToastProvider } from "../context/ToastContext";
import { StatsSyncProvider } from "../context/StatsSyncProvider";
import { UnreadProvider } from "../context/UnreadContext";

const parchmentBg = require("../assets/images/background.jpg");

// *** GLOBAL NOTIFICATION HANDLER (REQUIRED) ***
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // use our custom toast instead of iOS
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  // Load fonts ONCE for the whole app
  const [fontsLoaded] = useFonts({
    "Ringbearer-Regular": require("../assets/fonts/Ringbearer-Regular.ttf"),
    "Lora-Regular": require("../assets/fonts/Lora-Regular.ttf"),
    "Lora-Bold": require("../assets/fonts/Lora-Bold.ttf"),
    "Lora-MediumItalic": require("../assets/fonts/Lora-MediumItalic.ttf"),
  });

  // Initialize notification channels (Android)
  useEffect(() => {
    initNotificationChannels();
  }, []);

  // Foreground notification → global steampunk toast
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const body = notification?.request?.content?.body;
        if ((globalThis as any).showSteampunkToast && body) {
          (globalThis as any).showSteampunkToast(body);
        }
      }
    );
    return () => sub.remove();
  }, []);

  // Block UI until fonts are ready
  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ImageBackground
          source={parchmentBg}
          style={styles.full}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6b2b34" />
          </SafeAreaView>
        </ImageBackground>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={parchmentBg}
        style={styles.full}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safe}>
          <ToastProvider>
            <ProfileProvider>
              <StatsProvider>
                <StatsSyncProvider>
                  <AvatarProvider>
                    <UnreadProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: "fade",
                        }}
                      />
                    </UnreadProvider>
                  </AvatarProvider>
                </StatsSyncProvider>
              </StatsProvider>
            </ProfileProvider>
          </ToastProvider>
        </SafeAreaView>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
