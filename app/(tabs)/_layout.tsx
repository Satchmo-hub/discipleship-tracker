// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import TabIcon from "../../components/TabIcon";
import { useUnreadBounce } from "../../hooks/useUnreadBounce";

export default function TabsLayout() {
  // Custom hook controlling bounce behavior
  const { shouldBounce } = useUnreadBounce();

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

      {/* BADGES */}
      <Tabs.Screen
        name="badges"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../../assets/images/badges_tab.png")}
            />
          ),
        }}
      />

      {/* REMINDERS — bounce when unread */}
      <Tabs.Screen
        name="reminders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require("../../assets/images/rolledScroll.png")}
              bounce={shouldBounce}
            />
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
