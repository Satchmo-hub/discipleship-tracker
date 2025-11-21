// context/useMigrateData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Generic AsyncStorage migration helper
 * Handles version tracking, migration, and safe parsing.
 */
export async function useMigrateData<T>({
  storageKey,
  metaKey,
  currentVersion,
  migrate,
  defaults,
}: {
  storageKey: string;
  metaKey: string;
  currentVersion: number;
  migrate: (oldData: any, fromVersion: number) => T;
  defaults: T;
}): Promise<T> {
  const safeParse = (raw: string | null) => {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      console.warn(`⚠️ Corrupted data in ${storageKey}:`, raw);
      return {};
    }
  };

  const storedData = safeParse(await AsyncStorage.getItem(storageKey));
  const storedMeta = safeParse(await AsyncStorage.getItem(metaKey));
  let version = storedMeta.version ?? 1;
  let data = { ...storedData };

  // Perform migration if needed
  if (version < currentVersion) {
    console.log(`🧭 Migrating ${storageKey} v${version} → v${currentVersion}`);
    data = migrate(data, version);
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    await AsyncStorage.setItem(metaKey, JSON.stringify({ ...storedMeta, version: currentVersion }));
  }

  // Ensure version always written
  if (!storedMeta.version) {
    await AsyncStorage.setItem(metaKey, JSON.stringify({ ...storedMeta, version: currentVersion }));
  }

  return { ...defaults, ...data };
}
