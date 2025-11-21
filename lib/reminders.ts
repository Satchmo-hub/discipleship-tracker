// lib/reminders.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*********************************************************************
 * CONSTANTS
 *********************************************************************/

// AsyncStorage registry of all scheduled IDs
const STORAGE_KEY = "dt.reminders.scheduled";

// Maps reminder keys → notification IDs
const KEYMAP = "dt.reminders.keymap";

// Android notification channel
const ANDROID_CHANNEL_ID = "dt-reminders-channel";

// Bundled sound file (defined in app.json → ios.notification.sounds)
const REMINDER_SOUND = "angel_ahhh.mp3";

/*********************************************************************
 * ANDROID CHANNEL INIT
 *********************************************************************/
export async function initNotificationChannels() {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Discipleship Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: REMINDER_SOUND,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#FFCC00",
    });
  } catch (e) {
    console.warn("initNotificationChannels() failed:", e);
  }
}

/*********************************************************************
 * INTERNAL HELPERS — Registry Management
 *********************************************************************/
async function registerScheduledId(id: string) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    let list: string[] = [];

    try {
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }

    if (!list.includes(id)) list.push(id);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("registerScheduledId() failed:", e);
  }
}

async function registerKeyMap(key: string, id: string) {
  try {
    const raw = await AsyncStorage.getItem(KEYMAP);
    let map: Record<string, string> = {};

    try {
      map = raw ? JSON.parse(raw) : {};
    } catch {
      map = {};
    }

    map[key] = id;

    await AsyncStorage.setItem(KEYMAP, JSON.stringify(map));
  } catch (e) {
    console.warn("registerKeyMap() failed:", e);
  }
}

export async function cancelReminderByKey(key: string) {
  try {
    const raw = await AsyncStorage.getItem(KEYMAP);
    if (!raw) return;

    const map: Record<string, string> = JSON.parse(raw);
    const id = map[key];
    if (!id) return;

    await Notifications.cancelScheduledNotificationAsync(id);

    delete map[key];
    await AsyncStorage.setItem(KEYMAP, JSON.stringify(map));
  } catch (e) {
    console.warn("cancelReminderByKey() failed:", e);
  }
}

/*********************************************************************
 * PUBLIC — Schedule a DAILY Reminder
 *********************************************************************/
export async function scheduleReminder(opts: {
  key: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
}) {
  try {
    // Cancel any old reminder for this logical key
    await cancelReminderByKey(opts.key);

    // Daily repeating trigger at given hour/minute
    const trigger: Notifications.NotificationTriggerInput =
      Platform.OS === "ios" || Platform.OS === "android"
        ? {
            hour: opts.hour,
            minute: opts.minute,
            repeats: true,
          }
        : {
            // Fallback for web / others: 60s from now, non-critical
            seconds: 60,
          };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        sound: REMINDER_SOUND as any,
      },
      // On native, we want the time-of-day trigger
      trigger,
    });

    await registerScheduledId(id);
    await registerKeyMap(opts.key, id);

    return id;
  } catch (e) {
    console.warn("scheduleReminder() failed:", e);
    throw e;
  }
}

/*********************************************************************
 * OPTIONAL — Cancel ALL (for debugging)
 *********************************************************************/
export async function cancelAllReminders() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];

    if (Array.isArray(list)) {
      for (const id of list) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {}
      }
    }
  } catch (e) {
    console.warn("cancelAllReminders() failed:", e);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  await AsyncStorage.setItem(KEYMAP, JSON.stringify({}));
}
