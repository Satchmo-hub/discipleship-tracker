// lib/activityApi.ts — REWRITTEN FOR ENGINE v9
//------------------------------------------------------------
// • New lowercase ActivityType union (matches UI + StatsContext)
// • Backward‑compatible with old uppercase identifiers
// • Strict normalization → ONLY v9 strings hit Supabase
// • Clean payload structure
// • Batch logging included
//------------------------------------------------------------

import { supabase } from "../supabase/client";

//------------------------------------------------------------
// v9 Activity Types — lowercase, matches ActivitiesScreen + StatsContext
//------------------------------------------------------------
export type ActivityType =
  | "morning_prayer"
  | "evening_prayer"
  | "scripture"
  | "church"
  | "temple"
  | "mutual"
  | "service"
  | "kindness"
  | "sleep_start"
  | "sleep_end"
  | "sem_class"
  | "family_home_evening"
  | "custom"
  // Backwards compatibility with older uppercase events
  | "MORNING_PRAYER"
  | "EVENING_PRAYER"
  | "SCRIPTURE_STUDY"
  | "CHURCH"
  | "TEMPLE"
  | "MUTUAL"
  | "SERVICE"
  | "SEMINARY"
  | "FHE"
  | "KINDNESS"
  | "SLEEP_START"
  | "SLEEP_END"
  | "CUSTOM";

//------------------------------------------------------------
// Metadata container: optional params for any activity
//------------------------------------------------------------
export type ActivityMeta = {
  [key: string]: any;
};

//------------------------------------------------------------
// Normalization — maps incoming strings → official DB names
//------------------------------------------------------------
function normalizeActivityType(type: ActivityType): string {
  switch (type) {
    // --- NEW lowercase events
    case "morning_prayer":
    case "MORNING_PRAYER":
      return "morning_prayer";

    case "evening_prayer":
    case "EVENING_PRAYER":
      return "evening_prayer";

    case "scripture":
    case "SCRIPTURE_STUDY":
      return "scripture";

    case "church":
    case "CHURCH":
      return "church";

    case "temple":
    case "TEMPLE":
      return "temple";

    case "mutual":
    case "MUTUAL":
      return "mutual";

    case "service":
    case "SERVICE":
      return "service";

    case "kindness":
    case "KINDNESS":
      return "kindness";

    case "sleep_start":
    case "SLEEP_START":
      return "sleep_start";

    case "sleep_end":
    case "SLEEP_END":
      return "sleep_end";

    case "sem_class":
    case "SEMINARY":
      return "sem_class";

    case "family_home_evening":
    case "FHE":
      return "family_home_evening";

    case "custom":
    case "CUSTOM":
      return "custom";

    // fallback → sanitized lowercase
    default:
      return String(type).toLowerCase();
  }
}

//------------------------------------------------------------
// Log single activity
//------------------------------------------------------------
export async function logActivity(
  profileId: string,
  activityType: ActivityType,
  metadata: ActivityMeta = {}
) {
  if (!profileId) {
    console.warn("⚠️ logActivity called without profileId");
    return null;
  }

  const dbType = normalizeActivityType(activityType);

  const payload = {
    profile_id: profileId,
    activity_type: dbType,
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

  console.log(`✅ Activity logged: ${dbType}`, payload);
  return data;
}

//------------------------------------------------------------
// Batch Insert (sync multiple entries)
//------------------------------------------------------------
export async function logActivitiesBatch(
  profileId: string,
  entries: { activityType: ActivityType; metadata?: ActivityMeta }[]
) {
  if (!profileId) return null;
  if (entries.length === 0) return [];

  const rows = entries.map((entry) => ({
    profile_id: profileId,
    activity_type: normalizeActivityType(entry.activityType),
    metadata: entry.metadata ?? {},
  }));

  const { data, error } = await supabase
    .from("activities")
    .insert(rows)
    .select();

  if (error) {
    console.error("❌ Batch activity logging error:", error);
    return null;
  }

  console.log(`✅ Batch activities logged: ${rows.length}`);
  return data;
}
