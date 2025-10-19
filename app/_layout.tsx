import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatsProvider } from "@context/StatsContext"; // ✅ alias version

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: "#f4ecd8" },
            }}
          >
            {/* 👇 Main app tabs */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* 👇 Optional: add modal or future routes here */}
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </StatsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
