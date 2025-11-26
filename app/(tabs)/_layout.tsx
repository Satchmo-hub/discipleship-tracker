// app/(tabs)/_layout.tsx
//------------------------------------------------------------
import { Tabs } from "expo-router";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import TabIcon from "../../components/TabIcon";
import { useUnread } from "../../context/UnreadContext";
import { useBobBounce } from "../../hooks/useBobBounce";

export default function TabsLayout() {
  // Pull unread counts
  const { unreadMessages, unreadBadges } = useUnread();

  // Apply bounce if needed
  const bounceBadges = useBobBounce(unreadBadges > 0);
  const bounceReminders = useBobBounce(unreadMessages > 0);

  // Animated styles
  const badgeAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceBadges.value }],
  }));

  const remindersAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceReminders.value }],
  }));

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIndicatorStyle: { display: "none" },
        tabBarActiveTintColor: "transparent",
        tabBarInactiveTintColor: "transparent",
        tabBarPressColor: "transparent",
        tabBarItemStyle: { borderTopWidth: 0 },
        tabBarStyle: {
          backgroundColor: "#a78a57",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: "absolute",
          height: 92,
          paddingTop: 18,
          paddingBottom: 20,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../../assets/images/tab_home.png")}
            />
          ),
        }}
      />

      {/* ACTIVITIES */}
      <Tabs.Screen
        name="activities"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../../assets/images/activities_tab.png")}
            />
          ),
        }}
      />

      {/* BADGES (bobs when unread badges exist) */}
      <Tabs.Screen
        name="badges"
        options={{
          tabBarIcon: ({ focused }) => (
            <Animated.View style={badgeAnim}>
              <TabIcon
                focused={focused}
                source={require("../../assets/images/badges_tab.png")}
              />
            </Animated.View>
          ),
        }}
      />

      {/* REMINDERS (bobs when there are unread messages) */}
      <Tabs.Screen
        name="reminders"
        options={{
          tabBarIcon: ({ focused }) => (
            <Animated.View style={remindersAnim}>
              <TabIcon
                focused={focused}
                source={require("../../assets/images/reminders.png")}
              />
            </Animated.View>
          ),
        }}
      />

      {/* SETTINGS */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../../assets/images/settings_tab.png")}
            />
          ),
        }}
      />
    </Tabs>
  );
}
