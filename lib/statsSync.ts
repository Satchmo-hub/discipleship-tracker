// lib/statsSync.ts
import { supabase } from "./supabase";

export async function uploadStatsSnapshot(publicId: string, snapshot: any) {
  try {
    if (!publicId) return;

    const { error } = await supabase.from("dt_stats_snapshots").insert({
      student_public_id: publicId,
      snapshot,
    });

    if (error) {
      console.error("Error uploading stats snapshot:", error);
    }
  } catch (err) {
    console.error("Unexpected error uploading stats snapshot:", err);
  }
}
