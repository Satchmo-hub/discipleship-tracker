// context/ProfileProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";

const STORAGE_KEY = "dt.profile";

export type Profile = {
  uuid: string;
  public_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  school_id: string | null;
  teacher_id: string | null;
  grade_id: number | null;
  class_hour_id: number | null;
  avatar: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (updates: Partial<Profile>) => Promise<void>;
  clearProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside a ProfileProvider");
  return ctx;
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // =======================================================
  // Generate OR load a stable UUID for this installation
  // =======================================================
  const ensureUuid = async (): Promise<string> => {
    let uuid = await AsyncStorage.getItem("dt.uuid");

    if (!uuid) {
      uuid = Crypto.randomUUID(); // Expo-safe UUID generator
      await AsyncStorage.setItem("dt.uuid", uuid);
    }

    return uuid;
  };

  // =======================================================
  // Public ID generator (7 chars)
  // =======================================================
  const generatePublicId = (): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 7; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  const generateUniquePublicId = async (): Promise<string> => {
    for (let i = 0; i < 10; i++) {
      const candidate = generatePublicId();

      const { data } = await supabase
        .from("profiles")
        .select("public_id")
        .eq("public_id", candidate)
        .maybeSingle();

      if (!data) return candidate; // success
    }

    return generatePublicId(); // fallback
  };

  // =======================================================
  // Load or create the profile record in Supabase
  // =======================================================
  const loadOrCreateProfile = async () => {
    try {
      const uuid = await ensureUuid();

      // Try to load existing row
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("uuid", uuid)
        .maybeSingle();

      if (error) throw error;

      // If no row exists — create a default one
      if (!data) {
        const public_id = await generateUniquePublicId();

        const newProfile: Profile = {
          uuid,
          public_id,
          first_name: "Unknown",
          last_name: "User",
          email: null,
          school_id: null,
          teacher_id: null,
          grade_id: null,
          class_hour_id: null,
          avatar: null,
        };

        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (insertError) throw insertError;

        setProfile(created);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(created));
        return;
      }

      // Load existing row
      setProfile(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("❌ Failed to load/create profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load on app start
  useEffect(() => {
    loadOrCreateProfile();
  }, []);

  // =======================================================
  // Refresh from Supabase
  // =======================================================
  const refreshProfile = async () => {
    if (!profile?.uuid) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("uuid", profile.uuid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error("⚠️ Error refreshing profile:", err);
    }
  };

  // =======================================================
  // Save / Update profile
  // =======================================================
  const saveProfile = async (updates: Partial<Profile>) => {
    if (!profile?.uuid) return;

    setLoading(true);
    try {
      // Public ID must always exist
      const public_id =
        profile.public_id || (await generateUniquePublicId());

      const updated: Profile = {
        ...profile,
        ...updates,
        public_id,
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(updated, { onConflict: "uuid" })
        .select()
        .maybeSingle();

      if (error) throw error;

      setProfile(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      Alert.alert("Error", "Failed to update your profile.");
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // Clear local profile
  // =======================================================
  const clearProfile = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, "dt.uuid"]);
      setProfile(null);
      Alert.alert("Profile Cleared");
    } catch (err) {
      console.error("⚠️ Failed to clear profile:", err);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile,
        saveProfile,
        clearProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
