import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import _ from "lodash"; // 👈 install if missing: npm i lodash

const STORAGE_KEY = "dt.stats";

const DEFAULT_STATS = {
  level: 1,
  levelTitle: "Seedling Saint",
  health: 50,
  skill: 0,
  streak: 0,
  morningStreak: 0,
  scriptureStreak: 0,
  gender: "male",
};

const StatsContext = createContext(null);

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [resetVersion, setResetVersion] = useState(0);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // 🔄 Load saved stats on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log("📂 Loaded stats from storage:", parsed);
          setStats({ ...DEFAULT_STATS, ...parsed });
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
          console.log("📄 No saved stats — initialized defaults.");
        }
      } catch (err) {
        console.warn("⚠️ Error loading stats:", err);
      } finally {
        setStatsLoaded(true);
      }
    })();
  }, []);

  // 💾 Debounced save function (prevents collisions)
  const saveStats = useCallback(
    _.debounce(async (data) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log("💾 Stats saved:", data);
      } catch (err) {
        console.warn("⚠️ Error saving stats:", err);
      }
    }, 400),
    []
  );

  // Save when stats change (only after initial load)
  useEffect(() => {
    if (statsLoaded) saveStats(stats);
  }, [stats, statsLoaded]);

  // 📜 Level title auto-update
  useEffect(() => {
    if (!statsLoaded) return;
    const title = getLevelTitle(stats.level, stats.gender);
    if (title !== stats.levelTitle) {
      setStats((p) => ({ ...p, levelTitle: title }));
    }
  }, [stats.level, stats.gender]);

  // 📘 Level title lookup
  const getLevelTitle = (level, gender = "male") => {
    const titles = [
      "Seedling Saint",
      "Sunbeam",
      "Temple Messenger",
      gender === "male" ? "Priest" : "Priestess",
      "Disciple",
      "Saint",
      "Arm of God",
      "El Jefe",
      "Trogdor",
      "Hope of Israel",
      "Advocate",
      "Dragon Warrior",
      gender === "male" ? "Son of Abraham" : "Daughter of Abraham",
    ];
    return titles[level - 1] || titles[titles.length - 1];
  };

  // 🧠 Guards
  const ensureLoaded = (fnName) => {
    if (!statsLoaded) {
      console.log(`⚠️ Ignored ${fnName} — stats not yet loaded.`);
      return false;
    }
    return true;
  };

  // ⚔️ Mutations
  const addHealth = (amount) => {
    if (!ensureLoaded("addHealth")) return;
    setStats((prev) => {
      let newHealth = prev.health + amount;
      let newSkill = prev.skill;
      let newLevel = prev.level;

      if (newHealth >= 100) {
        const overflow = Math.floor(newHealth / 100);
        newSkill += overflow * 2;
        newHealth = newHealth % 100;
      }

      if (newSkill >= 100) {
        const overflow = Math.floor(newSkill / 100);
        newLevel += overflow;
        newSkill = newSkill % 100;
      }

      const updated = { ...prev, health: newHealth, skill: newSkill, level: newLevel };
      console.log("💪 addHealth:", { before: prev, after: updated });
      return updated;
    });
  };

  const addSkill = (amount) => {
    if (!ensureLoaded("addSkill")) return;
    setStats((prev) => {
      let newSkill = prev.skill + amount;
      let newLevel = prev.level;
      if (newSkill >= 100) {
        const overflow = Math.floor(newSkill / 100);
        newLevel += overflow;
        newSkill = newSkill % 100;
      }
      const updated = { ...prev, skill: newSkill, level: newLevel };
      console.log("📈 addSkill:", { before: prev, after: updated });
      return updated;
    });
  };

  const incrementStreak = () => {
    if (!ensureLoaded("incrementStreak")) return;
    setStats((p) => ({ ...p, streak: p.streak + 1 }));
    console.log("🔥 incrementStreak →", stats.streak + 1);
  };

  const incrementMorningStreak = () => {
    if (!ensureLoaded("incrementMorningStreak")) return;
    setStats((p) => ({ ...p, morningStreak: p.morningStreak + 1 }));
    console.log("☀️ incrementMorningStreak →", stats.morningStreak + 1);
  };

  const incrementScriptureStreak = () => {
    if (!ensureLoaded("incrementScriptureStreak")) return;
    setStats((p) => ({ ...p, scriptureStreak: p.scriptureStreak + 1 }));
    console.log("📖 incrementScriptureStreak →", stats.scriptureStreak + 1);
  };

  const resetDaily = () => {
    if (!ensureLoaded("resetDaily")) return;
    setStats((p) => ({ ...p, morningStreak: 0, scriptureStreak: 0 }));
    console.log("🧹 resetDaily executed.");
  };

  const resetWeekly = () => {
    if (!ensureLoaded("resetWeekly")) return;
    setStats((p) => ({ ...p, skill: 0, streak: 0 }));
    console.log("📆 resetWeekly executed.");
  };

  const resetAllData = async () => {
    if (!ensureLoaded("resetAllData")) return;
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        "dt.daily",
        "dt.weekly",
        "dt.kindness",
        "dt.sleep",
        "dt.lastReset",
      ]);
      const fresh = { ...DEFAULT_STATS };
      setStats(fresh);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setResetVersion((v) => v + 1);
      console.log("🔄 resetAllData completed. Stats reset to defaults.");
    } catch (err) {
      console.warn("⚠️ Error resetting all data:", err);
    }
  };

  const setGender = (gender) => {
    if (!ensureLoaded("setGender")) return;
    setStats((p) => ({ ...p, gender }));
    console.log("⚧ Gender set:", gender);
  };

  return (
    <StatsContext.Provider
      value={{
        stats,
        addHealth,
        addSkill,
        incrementStreak,
        incrementMorningStreak,
        incrementScriptureStreak,
        resetDaily,
        resetWeekly,
        resetAllData,
        setGender,
        resetVersion,
        statsLoaded,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error("useStats must be used within a StatsProvider");
  return ctx;
};
