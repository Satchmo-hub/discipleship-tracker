//------------------------------------------------------------
// REAL PROFILE CONTEXT + AUTO-CREATE + SECURE GODMODE
// • Auto-creates profile if missing
// • Loads teacher_code column
// • Teacher Mode requires entering GODmode-2025
// • Email alone does NOT activate Teacher Mode (strong 2FA)
// • Teacher mode persists via AsyncStorage
//------------------------------------------------------------

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase/client";

const TEACHER_MODE_KEY = "dt.teacherMode.v1";
const GODMODE_EMAIL = "satchmo@satch.org";
const GODMODE_CODE = "GODmode-2025";

//------------------------------------------------------------
// CONTEXT SHAPE
//------------------------------------------------------------
const ProfileContext = createContext({
  profile: null,
  loading: true,
  isTeacherMode: false,
  activateTeacherMode: async (code: string) => false,
  refreshProfile: async () => {},
  saveProfile: async () => ({ error: null }),
});

//------------------------------------------------------------
// PROVIDER
//------------------------------------------------------------
export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  //------------------------------------------------------------
  // INIT LOAD
  //------------------------------------------------------------
  useEffect(() => {
    loadEverything();
  }, []);

  //------------------------------------------------------------
  // LOAD PROFILE — AUTO-CREATE IF MISSING
  //------------------------------------------------------------
  async function loadEverything() {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        console.warn("⚠️ No Supabase session — user must sign in");
        setProfile(null);
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email || "unknown@example.com";

      //------------------------------------------------------------
      // LOAD PROFILE FROM DB
      //------------------------------------------------------------
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("uuid", userId)
        .single();

      if (existing) {
        // Restore teacher mode from previous sessions
        const stored = await AsyncStorage.getItem(TEACHER_MODE_KEY);
        if (stored === "enabled") setIsTeacherMode(true);

        // Strong 2FA: email alone does NOT activate teacher mode
        if (userEmail.toLowerCase() === GODMODE_EMAIL.toLowerCase()) {
          console.log("🟣 Godmode email detected — access code still required.");
        }

        setProfile(existing);
        setLoading(false);
        return;
      }

      //------------------------------------------------------------
      // AUTO-CREATE NEW PROFILE IF NOT FOUND
      //------------------------------------------------------------
      console.warn("🆕 No profile found — auto-creating new profile…");

      await supabase.from("profiles").insert({
        uuid: userId,
        email: userEmail,
        first_name: "",
        last_name: "",
        public_id: userId.slice(0, 8),
        avatar: null,
        grade_id: null,
        class_hour_id: null,
        teacher_id: null,
        teacher_code: null, // existing teachers still populate this manually
      });

      const { data: newProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("uuid", userId)
        .single();

      setProfile(newProfile);

      const storedTeacherMode = await AsyncStorage.getItem(TEACHER_MODE_KEY);
      if (storedTeacherMode === "enabled") setIsTeacherMode(true);

    } catch (err) {
      console.error("❌ Unexpected ProfileContext error:", err);
    }

    setLoading(false);
  }

  //------------------------------------------------------------
  // ACTIVATE TEACHER MODE (GODMODE OR TEACHER_CODE)
  //------------------------------------------------------------
  async function activateTeacherMode(code: string) {
    if (!profile) return false;

    const normalized = code.trim();
    const email = profile.email?.toLowerCase() ?? "";

    // Godmode user MUST enter the secret code
    if (email === GODMODE_EMAIL.toLowerCase()) {
      if (normalized === GODMODE_CODE) {
        console.log("🔓 GODMODE ACTIVATED");
        setIsTeacherMode(true);
        await AsyncStorage.setItem(TEACHER_MODE_KEY, "enabled");
        return true;
      }
      return false;
    }

    // Standard teacher code activation for normal teachers
    if (profile.teacher_code && normalized === profile.teacher_code.trim()) {
      console.log("🔓 Teacher Mode ACTIVATED");
      setIsTeacherMode(true);
      await AsyncStorage.setItem(TEACHER_MODE_KEY, "enabled");
      return true;
    }

    return false;
  }

  //------------------------------------------------------------
  // REFRESH PROFILE
  //------------------------------------------------------------
  async function refreshProfile() {
    return loadEverything();
  }

  //------------------------------------------------------------
  // SAVE PROFILE
  //------------------------------------------------------------
  async function saveProfile(values) {
    if (!profile?.uuid) return { error: "No profile loaded" };

    const { error } = await supabase
      .from("profiles")
      .update(values)
      .eq("uuid", profile.uuid);

    if (!error) await refreshProfile();
    return { error };
  }

  //------------------------------------------------------------
  // PROVIDER OUTPUT
  //------------------------------------------------------------
  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        isTeacherMode,
        activateTeacherMode,
        refreshProfile,
        saveProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

//------------------------------------------------------------
// HOOK
//------------------------------------------------------------
export const useProfile = () => useContext(ProfileContext);
