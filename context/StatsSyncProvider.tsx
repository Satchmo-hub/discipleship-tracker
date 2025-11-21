// context/StatsSyncProvider.tsx

import React, { useEffect, useRef } from "react";
import { useProfile } from "./ProfileContext";
import { useStats } from "./StatsContext";
import { uploadStatsSnapshot } from "../lib/statsSync";

export function StatsSyncProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const stats = useStats(); // whatever your stats hook returns

  // Prevent constant uploads by throttling
  const lastUploadRef = useRef<number>(0);

  useEffect(() => {
    if (!profile?.public_id) return;
    if (!stats) return;

    const now = Date.now();

    // Only upload every 15 seconds max
    if (now - lastUploadRef.current < 15000) {
      return;
    }

    lastUploadRef.current = now;

    // Upload them!
    uploadStatsSnapshot(profile.public_id, stats);

  }, [profile, stats]);

  return <>{children}</>;
}
