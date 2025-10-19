// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatsProvider } from "@context/StatsContext"; // ✅ fixed alias

export default function RootTabsLayout() {
  return (
    <StatsProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          swipeEnabled: true,
          gestureEnabled: true,
          tabBarActiveTintColor: "#a37b3f",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: {
            backgroundColor: "#f4ecd8",
            borderTopWidth: 1,
            borderTopColor: "#c9b899",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discipleship"
          options={{
            title: "Discipleship",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="hand-left-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </StatsProvider>
  );
}
