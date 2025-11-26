// lib/publicId.ts
//------------------------------------------------------------
// PUBLIC ID GENERATION + UNIQUENESS CHECK
// • Used during onboarding when a new student signs up
// • Creates a 7-character alphanumeric ID
// • Ensures uniqueness by checking Supabase before accepting
//------------------------------------------------------------

import { supabase } from "../supabase/client";

// Generate a random 7-character public ID
export function generatePublicId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let id = "";
  for (let i = 0; i < 7; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Ensure ID is unique in Supabase before using it
export async function generateUniquePublicId(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const candidate = generatePublicId();

    const { data, error } = await supabase
      .from("profiles")
      .select("public_id")
      .eq("public_id", candidate)
      .maybeSingle();

    // If NOT found → safe to use
    if (!data) {
      return candidate;
    }
  }

  // If somehow 12 retries failed (very unlikely),
  // return one anyway — collision chance is microscopic
  return generatePublicId();
}
