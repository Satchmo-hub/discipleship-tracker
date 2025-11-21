import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStats, MAX_DAILY_SERVICES } from "../../context/StatsContext";
import ParchmentScreen from "../../components/ParchmentScreen";
import BrassActionPlate from "../../components/BrassActionPlate";
import { useProfile } from "../../context/ProfileContext";
import { logActivity } from "../../lib/activityApi";

// === Helpers ===
function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function weekKey(ts) {
  const d = new Date(ts);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default function ActivitiesScreen() {
  const { profile } = useProfile();

  const {
    state,
    logMorningPrayer,
    logEveningPrayer,
    logScripture,
    logService,
    logWeekly,
    startSleep,
    endSleep,
  } = useStats();

  // Unified activity handler: local update + Supabase log
  const handleActivity = async (
    type: string,
    localAction: Function,
    metadata: any = {}
  ) => {
    // Local stats engine
    localAction();

    // Supabase
    if (profile?.uuid) {
      await logActivity(profile.uuid, type, metadata);
    } else {
      console.warn("⚠️ Missing profile UUID — cannot log activity.");
    }
  };

  const now = Date.now();
  const dKey = useMemo(() => dayKey(now), [now]);
  const wKey = useMemo(() => weekKey(now), [now]);

  const today = state?.byDay?.[dKey] ?? {
    morningPrayer: false,
    eveningPrayer: false,
    scripture: false,
    services: 0,
  };

  const thisWeek = state?.byWeek?.[wKey] ?? {
    church: false,
    mutual: false,
    temple: false,
  };

  const sleeping = !!state?.sleep?.currentStart;

  // Kindness counter logic
  const kindnessUsed = today.services ?? 0;
  const kindnessRemaining = Math.max(0, MAX_DAILY_SERVICES - kindnessUsed);

  const handleSleepPress = async () => {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;

    if (!sleeping && hour < 21) {
      Alert.alert("Wait", "You can start the sleep tracker at or after 9:00 p.m.");
      return;
    }

    if (sleeping) {
      // End sleep + log metadata timestamp
      handleActivity("SLEEP_END", endSleep, {
        ended_at: new Date().toISOString(),
      });
    } else {
      // Start sleep + log metadata timestamp
      handleActivity("SLEEP_START", startSleep, {
        started_at: new Date().toISOString(),
      });
    }
  };

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

          {/* DAILY */}
          <Text style={styles.sectionTitle}>Daily Activities</Text>

          <BrassActionPlate
            label="Morning Prayer"
            done={today.morningPrayer}
            onPress={() =>
              handleActivity("MORNING_PRAYER", logMorningPrayer, {
                day: dKey,
              })
            }
            mode="daily"
          />

          <BrassActionPlate
            label="Evening Prayer"
            done={today.eveningPrayer}
            onPress={() =>
              handleActivity("EVENING_PRAYER", logEveningPrayer, {
                day: dKey,
              })
            }
            mode="daily"
          />

          <BrassActionPlate
            label="Scripture Study"
            done={today.scripture}
            onPress={() =>
              handleActivity("SCRIPTURE_STUDY", logScripture, {
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

          {/* WEEKLY */}
          <Text style={styles.sectionTitle}>Weekly Activities</Text>

          <BrassActionPlate
            label="Church Attendance"
            done={thisWeek.church}
            onPress={() =>
              handleActivity("CHURCH", () => logWeekly("church"), {
                week: wKey,
              })
            }
            mode="weekly"
          />

          <BrassActionPlate
            label="Temple Attendance"
            done={thisWeek.temple}
            onPress={() =>
              handleActivity("TEMPLE", () => logWeekly("temple"), {
                week: wKey,
              })
            }
            mode="weekly"
          />

          <BrassActionPlate
            label="Mutual"
            done={thisWeek.mutual}
            onPress={() =>
              handleActivity("MUTUAL", () => logWeekly("mutual"), {
                week: wKey,
              })
            }
            mode="weekly"
          />

          {/* KINDNESS */}
          <Text style={styles.sectionTitle}>Acts of Kindness</Text>

          <Text style={styles.remainingLabel}>
            Activities Remaining:{" "}
            <Text style={styles.remainingNumber}>{kindnessRemaining}</Text>
          </Text>

          {[
            "Help a Parent",
            "Help a Sibling",
            "Textify",
            "Jesus Ninja",
            "Your Choice",
          ].map((label) => (
            <BrassActionPlate
              key={label}
              label={label}
              done={kindnessRemaining <= 0}
              onPress={() =>
                handleActivity("SERVICE", logService, {
                  kindness_label: label,
                  day: dKey,
                })
              }
              mode="kindness"
            />
          ))}
        </View>
      </SafeAreaView>
    </ParchmentScreen>
  );
}

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
