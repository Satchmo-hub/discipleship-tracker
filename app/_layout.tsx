// app/_layout.tsx
//------------------------------------------------------------
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";

import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../supabase/client";
import { initNotificationChannels } from "../lib/reminders";

// Providers
import { AuthProvider } from "../context/AuthContext";
import { AvatarProvider } from "../context/AvatarContext";
import { ProfileProvider } from "../context/ProfileContext";
import { StatsProvider } from "../context/StatsContext";
import { StatsSyncProvider } from "../context/StatsSyncProvider";
import { ToastProvider } from "../context/ToastContext";
import { UnreadProvider } from "../context/UnreadContext";

const parchmentBg = require("../assets/images/background.jpg");

// ------------------------------------------------------------
// NOTIFICATION HANDLER
// ------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ------------------------------------------------------------
// ROUTING GATE — FORCE USER INTO (tabs)
// ------------------------------------------------------------
function RoutingGate() {
  const segments = useSegments();
  const router = useRouter();

  const inTabs = segments[0] === "(tabs)";

  useEffect(() => {
    if (!inTabs) {
      router.replace("/(tabs)/index");
    }
  }, [inTabs]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
  );
}

// ------------------------------------------------------------
// ROOT LAYOUT WITH GOD-MODE AUTO LOGIN
// ------------------------------------------------------------
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Ringbearer-Regular": require("../assets/fonts/Ringbearer-Regular.ttf"),
    "Lora-Regular": require("../assets/fonts/Lora-Regular.ttf"),
    "Lora-Bold": require("../assets/fonts/Lora-Bold.ttf"),
    "Lora-MediumItalic": require("../assets/fonts/Lora-MediumItalic.ttf"),
  });

  const [authReady, setAuthReady] = useState(false);

  // --------------------------------------------------------
  // AUTO-LOGIN GOD MODE (runs ONCE before rendering app)
  // --------------------------------------------------------
  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Check existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setAuthReady(true);
          return;
        }

        // 2. No session → auto-login God account
        const { error } = await supabase.auth.signInWithPassword({
          email: "satchmo@satch.org",
          password: "Cr0ckett!",
        });

        if (error) {
          console.log("❌ Auto-login error:", error.message);
        } else {
          console.log("✅ Auto-login success");
        }
      } catch (err) {
        console.log("❌ God login exception:", err);
      } finally {
        setAuthReady(true);
      }
    }

    bootstrap();
  }, []);

  // --------------------------------------------------------
  // INIT NOTIFICATION CHANNELS
  // --------------------------------------------------------
  useEffect(() => {
    initNotificationChannels();
  }, []);

  // --------------------------------------------------------
  // TOAST NOTIFICATION LISTENER
  // --------------------------------------------------------
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const body = notification?.request?.content?.body;
      if ((globalThis as any).showSteampunkToast && body) {
        (globalThis as any).showSteampunkToast(body);
      }
    });
    return () => sub.remove();
  }, []);

  // --------------------------------------------------------
  // SHOW SPLASH UNTIL FONTS + AUTH LOAD
  // --------------------------------------------------------
  const notReady = !fontsLoaded || !authReady;

  if (notReady) {
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

  // --------------------------------------------------------
  // PROVIDERS + ROUTING
  // --------------------------------------------------------
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={parchmentBg}
        style={styles.full}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safe}>
          <ToastProvider>
            <AuthProvider>
              <ProfileProvider>
                <StatsProvider>
                  <StatsSyncProvider>
                    <AvatarProvider>
                      <UnreadProvider>

                        <RoutingGate />

                      </UnreadProvider>
                    </AvatarProvider>
                  </StatsSyncProvider>
                </StatsProvider>
              </ProfileProvider>
            </AuthProvider>
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
