// app/(tabs)/activities.tsx — ENGINE v9.1 COMPATIBLE
// ------------------------------------------------------------
// • Imports normalizeDayKey / normalizeWeekKey directly from StatsContext
// • No local helper overrides
// • All UI + behavior unchanged
// ------------------------------------------------------------

import React, { useMemo } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ParchmentScreen from "../../components/ParchmentScreen";
import BrassActionPlate from "../../components/BrassActionPlate";
import { useProfile } from "../../context/ProfileContext";

import {
  useStats,
  MAX_DAILY_SERVICES,
  normalizeDayKey,
  normalizeWeekKey,
} from "../../context/StatsContext";

import { logActivity } from "../../lib/activityApi";

// ------------------------------------------------------------
// Screen
// ------------------------------------------------------------
export default function ActivitiesScreen() {
  const { profile } = useProfile();
  const {
    state,
    logMorningPrayer,
    logEveningPrayer,
    logScripture,
    logService,
    logKindness,
    logWeekly,
    startSleep,
    endSleep,
  } = useStats();

  // ------------------------------------------------------------
  // Unified Logger (local + Supabase)
  // ------------------------------------------------------------
  const handleActivity = async (
    type: string,
    localAction: Function,
    metadata: any = {}
  ) => {
    localAction();

    if (profile?.uuid) {
      await logActivity(profile.uuid, type.toLowerCase(), metadata);
    } else {
      console.warn("⚠️ Missing profile UUID — cannot log activity.");
    }
  };

  // ------------------------------------------------------------
  // Keys (MATCH StatsContext EXACTLY)
  // ------------------------------------------------------------
  const now = Date.now();
  const dKey = useMemo(() => normalizeDayKey(now), [now]);
  const wKey = useMemo(() => normalizeWeekKey(now), [now]);

  // ------------------------------------------------------------
  // Today + Week State
  // ------------------------------------------------------------
  const today = state?.byDay?.[dKey] ?? {
    morningPrayer: false,
    eveningPrayer: false,
    scripture: false,
    services: 0,
    sleepAwardApplied: false,
  };

  const thisWeek = state?.byWeek?.[wKey] ?? {
    church: false,
    mutual: false,
    temple: false,
  };

  const sleeping = !!state?.sleep?.currentStart;

  // ------------------------------------------------------------
  // Kindness Logic (v9.1)
  // ------------------------------------------------------------
  const kindnessCount = today.services ?? 0;
  const kindnessRemaining = Math.max(
    0,
    MAX_DAILY_SERVICES - kindnessCount
  );

  const kindnessLabels = [
    "Help a Parent",
    "Help a Sibling",
    "Reach Out",
    "Encourage Someone",
    "Your Choice",
  ];

  // ------------------------------------------------------------
  // Sleep Tracker Enforcement
  // ------------------------------------------------------------
  const handleSleepPress = () => {
    const d = new Date();
    const hour = d.getHours() + d.getMinutes() / 60;

    // Can only start after 9pm
    if (!sleeping && hour < 21) {
      Alert.alert(
        "Wait",
        "You can start the sleep tracker at or after 9:00 p.m."
      );
      return;
    }

    if (sleeping) {
      handleActivity("sleep_end", endSleep, {
        ended_at: new Date().toISOString(),
      });
    } else {
      handleActivity("sleep_start", startSleep, {
        started_at: new Date().toISOString(),
      });
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <ParchmentScreen safeTopPadding>
      <SafeAreaView style={styles.safe}>
        <View style={styles.wrapper}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Activities</Text>
            <Image
              source={require("../../assets/images/activities_tab.png")}
              style={styles.tabIcon}
            />
          </View>

          {/* DAILY ACTIVITIES */}
          <Text style={styles.sectionTitle}>Daily Activities</Text>

          <BrassActionPlate
            label="Morning Prayer"
            done={today.morningPrayer}
            onPress={() =>
              handleActivity("morning_prayer", logMorningPrayer, {
                day: dKey,
              })
            }
            mode="daily"
          />

          <BrassActionPlate
            label="Evening Prayer"
            done={today.eveningPrayer}
            onPress={() =>
              handleActivity("evening_prayer", logEveningPrayer, {
                day: dKey,
              })
            }
            mode="daily"
          />

          <BrassActionPlate
            label="Scripture Study"
            done={today.scripture}
            onPress={() =>
              handleActivity("scripture", logScripture, {
                day: dKey,
              })
            }
            mode="daily"
          />

          <BrassActionPlate
            label="Sleep Tracker"
            done={sleeping}
            onPress={handleSleepPress}
            sleepMode
            mode="daily"
          />

          {/* WEEKLY ACTIVITIES */}
          <Text style={styles.sectionTitle}>Weekly Activities</Text>

          <BrassActionPlate
            label="Church Attendance"
            done={thisWeek.church}
            onPress={() =>
              handleActivity("church", () => logWeekly("church"), {
                week: wKey,
              })
            }
            mode="weekly"
          />

          <BrassActionPlate
            label="Temple Attendance"
            done={thisWeek.temple}
            onPress={() =>
              handleActivity("temple", () => logWeekly("temple"), {
                week: wKey,
              })
            }
            mode="weekly"
          />

          <BrassActionPlate
            label="Mutual"
            done={thisWeek.mutual}
            onPress={() =>
              handleActivity("mutual", () => logWeekly("mutual"), {
                week: wKey,
              })
            }
            mode="weekly"
          />

          {/* KINDNESS */}
          <Text style={styles.sectionTitle}>Acts of Kindness</Text>

          <Text style={styles.remainingLabel}>
            Activities Remaining:{" "}
            <Text style={styles.remainingNumber}>
              {kindnessRemaining}
            </Text>
          </Text>

          {kindnessLabels.map((label) => {
            const done = kindnessCount >= MAX_DAILY_SERVICES;

            return (
              <BrassActionPlate
                key={label}
                label={label}
                done={done}
                count={kindnessCount}
                onPress={() =>
                  handleActivity("kindness", logKindness, {
                    day: dKey,
                  })
                }
                mode="kindness"
              />
            );
          })}
        </View>
      </SafeAreaView>
    </ParchmentScreen>
  );
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  wrapper: {
    width: "100%",
    paddingHorizontal: 10,
    alignItems: "center",
    paddingBottom: 140,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 38,
    color: "#2e2618",
  },
  tabIcon: {
    width: 90,
    height: 90,
    marginTop: -4,
    resizeMode: "contain",
  },
  sectionTitle: {
    fontSize: 23,
    fontFamily: "Lora-Regular",
    color: "#2e2618",
    marginTop: 20,
    marginBottom: 6,
    textAlign: "center",
  },
  remainingLabel: {
    fontSize: 16,
    fontFamily: "Lora-Regular",
    color: "#3a2e1c",
    marginBottom: 6,
    textAlign: "center",
  },
  remainingNumber: {
    fontFamily: "Lora-Bold",
    color: "#2e2618",
  },
});
