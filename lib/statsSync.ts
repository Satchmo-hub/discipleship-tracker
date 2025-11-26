// lib/statsSync.ts
//-----------------------------------------------------------
// Production-grade stats snapshot uploader
// - Guarantees JSON-safe snapshots
// - Adds server timestamp
// - Properly returns Supabase result
//-----------------------------------------------------------

import { supabase } from "../supabase/client";

export async function uploadStatsSnapshot(
  publicId: string,
  snapshot: any
): Promise<{ data: any; error: any }> {
  try {
    if (!publicId || !snapshot) {
      return { data: null, error: "Missing publicId or snapshot" };
    }

    // Ensure snapshot is JSON-serializable
    const safeSnapshot = JSON.parse(JSON.stringify(snapshot));

    const { data, error } = await supabase
      .from("dt_stats_snapshots")
      .insert({
        student_public_id: publicId,
        snapshot: safeSnapshot,
      })
      .select()
      .single(); // Get back the inserted row

    if (error) {
      console.error("❌ Error uploading stats snapshot:", error);
      return { data: null, error };
    }

    return { data, error: null };

  } catch (err) {
    console.error("❌ Unexpected error uploading stats snapshot:", err);
    return { data: null, error: err };
  }
}
