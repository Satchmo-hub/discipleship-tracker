// hooks/useSteamSound.ts
import { useState, useEffect, useCallback } from "react";
import { Audio } from "expo-av";

export function useSteamSound() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;
    let loaded: Audio.Sound | null = null;

    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const res = await Audio.Sound.createAsync(
          require("../assets/sounds/steam.wav")
        );

        loaded = res.sound;
        if (mounted) setSound(res.sound);
      } catch (e) {
        console.warn("Steam sound load failed:", e);
      }
    })();

    return () => {
      mounted = false;
      if (loaded) loaded.unloadAsync();
    };
  }, []);

  const playSteam = useCallback(async () => {
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch (e) {}
  }, [sound]);

  return { playSteam };
}
