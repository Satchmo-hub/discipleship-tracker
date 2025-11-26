// context/StatsSyncProvider.tsx
//-----------------------------------------------------------
// Production-Ready Sync Wrapper
//
// - Only syncs when actual stats STATE changes
// - Never uploads API object (which contains functions)
// - Avoids uploads during hydration
// - 15-second throttle
// - Safe against missing profile or missing public_id
//-----------------------------------------------------------

import React, { useEffect, useRef } from "react";
import { uploadStatsSnapshot } from "../lib/statsSync";
import { useProfile } from "./ProfileContext";
import { useStats } from "./StatsContext";

export function StatsSyncProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const statsAPI = useStats();

  // We only want the *state*, not the API wrapper (which contains functions)
  const statsState = statsAPI?.state;

  // Prevent constant uploads
  const lastUploadRef = useRef<number>(0);

  // Keep a reference to the last successfully uploaded state
  const prevStateRef = useRef<any>(null);

  useEffect(() => {
    // Guard: profile must be ready
    if (!profile?.public_id) return;

    // Guard: stats engine must be initialized
    if (!statsState) return;

    // If statsState has no timestamps, the engine is still hydrating/loading
    if (!statsState.createdAt || !statsState.lastCalcAt) return;

    // Convert to JSON to allow clean deep compare (no functions in state)
    const serializedCurrent = JSON.stringify(statsState);
    const serializedPrev = prevStateRef.current;

    // Prevent uploads if state hasn't changed
    if (serializedPrev === serializedCurrent) {
      return;
    }

    // Throttle: ensure minimum 15 seconds between uploads
    const now = Date.now();
    if (now - lastUploadRef.current < 15000) {
      return;
    }

    // Update last upload time
    lastUploadRef.current = now;

    // Update the last uploaded snapshot reference
    prevStateRef.current = serializedCurrent;

    // Perform the upload
    uploadStatsSnapshot(profile.public_id, statsState);

  }, [profile, statsState]);

  return <>{children}</>;
}
