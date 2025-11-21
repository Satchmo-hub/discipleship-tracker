// context/AvatarContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "./ProfileContext";

const STORAGE_KEY = "dt.avatar";

type AvatarContextType = {
  avatar: string | null;
  saveAvatar: (key: string) => Promise<void>;
  resetAvatar: () => Promise<void>;
};

const AvatarContext = createContext<AvatarContextType | null>(null);

export const useAvatar = () => {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within an AvatarProvider");
  return ctx;
};

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { saveProfile, profile } = useProfile();
  const [avatar, setAvatar] = useState<string | null>(null);

  // === Load avatar from AsyncStorage or from profile if exists ===
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setAvatar(stored);
        } else if (profile?.avatar) {
          setAvatar(profile.avatar);
          await AsyncStorage.setItem(STORAGE_KEY, profile.avatar);
        }
      } catch (err) {
        console.error("⚠️ Error loading avatar:", err);
      }
    })();
  }, [profile?.avatar]);

  // === Save avatar ===
  const saveAvatar = async (key: string) => {
    try {
      setAvatar(key);
      await AsyncStorage.setItem(STORAGE_KEY, key);
      // also sync to profile (to persist to Supabase)
      await saveProfile({ avatar: key });
      console.log("✅ Avatar saved & synced:", key);
    } catch (err) {
      console.error("❌ Failed to save avatar:", err);
    }
  };

  // === Reset avatar ===
  const resetAvatar = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setAvatar(null);
      await saveProfile({ avatar: null });
      console.log("✅ Avatar reset & synced");
    } catch (err) {
      console.error("❌ Failed to reset avatar:", err);
    }
  };

  return (
    <AvatarContext.Provider value={{ avatar, saveAvatar, resetAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}
