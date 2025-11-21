// lib/activityApi.ts
import { supabase } from "./supabase";

/**
 * Types of activities the app can log.
 * Add more strings here as needed — the backend will accept any of them.
 */
export type ActivityType =
  | "MORNING_PRAYER"
  | "EVENING_PRAYER"
  | "SCRIPTURE_STUDY"
  | "CHURCH"
  | "TEMPLE"
  | "MUTUAL"
  | "SERVICE"
  | "SLEEP_START"
  | "SLEEP_END"
  | "CUSTOM";

/**
 * Extra metadata you may want to attach to an activity:
 * - sleep start/end times
 * - duration
 * - step counts
 * - emotion ratings
 * - anything you want in the future
 */
export type ActivityMeta = {
  [key: string]: any;
};

/**
 * Safely logs a single activity to Supabase.
 */
export async function logActivity(
  profileId: string,
  activityType: ActivityType,
  metadata: ActivityMeta = {}
) {
  if (!profileId) {
    console.warn("⚠️ logActivity called without profileId");
    return null;
  }

  const payload = {
    profile_id: profileId,
    activity_type: activityType,
    metadata,
  };

  const { data, error } = await supabase
    .from("activities")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    console.error("❌ logActivity Supabase error:", error);
    return null;
  }

  console.log("✅ Activity logged:", payload);
  return data;
}

/**
 * Batch logging — not used yet, but invaluable if:
 * - you add offline mode
 * - you sync multiple activities at app launch
 */
export async function logActivitiesBatch(
  profileId: string,
  entries: { activityType: ActivityType; metadata?: ActivityMeta }[]
) {
  if (!profileId) return null;
  if (!entries.length) return [];

  const rows = entries.map((e) => ({
    profile_id: profileId,
    activity_type: e.activityType,
    metadata: e.metadata ?? {},
  }));

  const { data, error } = await supabase
    .from("activities")
    .insert(rows)
    .select();

  if (error) {
    console.error("❌ Batch activity logging error:", error);
    return null;
  }

  console.log("✅ Batch activities logged:", rows.length);
  return data;
}
