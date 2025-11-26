import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// Custom storage adapter for Supabase Auth
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } =
  Constants.expoConfig?.extra ?? {};

console.log("🟣 SUPABASE URL:", EXPO_PUBLIC_SUPABASE_URL);
console.log("🟣 SUPABASE KEY:", EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 6));

export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: ExpoSecureStoreAdapter,
      detectSessionInUrl: false,
      flowType: "pkce", // ⭐ REQUIRED for stable Expo auth
    },
  }
);
