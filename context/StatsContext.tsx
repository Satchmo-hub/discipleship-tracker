// ============================================================
// context/StatsContext.tsx — Engine v9.1 (Synced + Corrected)
// ------------------------------------------------------------
// • Exports normalizeDayKey / normalizeWeekKey for ActivitiesScreen
// • Kindness increments services
// • All v8/9 engine logic preserved
// • Daily + Weekly keys now consistent across entire app
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useRef,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "./ToastContext";

// ============================================================
// ENGINE VERSION
// ============================================================
export const ENGINE_VERSION = 9;

// ============================================================
// CONFIG CONSTANTS
// ============================================================
const ACTIVE_START_HOUR = 6.5; // 6:30am
const ACTIVE_END_HOUR = 21;    // 9:00pm

const HEALTH_DECAY_PER_ACTIVE_HOUR = 50 / 29;

const PTS_MORNING_PRAYER = 6;
const PTS_EVENING_PRAYER = 6;
const PTS_SCRIPTURE = 8;

const PTS_SERVICE = 3;
const PTS_KINDNESS = 3;

const PTS_BADGE = 5;

const PTS_SLEEP_BONUS = 8;
const PTS_SLEEP_PENALTY = 8;
const SLEEP_THRESHOLD_HOURS = 6;

const LEVEL_TRIGGER_PERCENT = 98;

export const MAX_DAILY_SERVICES = 5;

const PTS_CHURCH = 12;
const PTS_MUTUAL = 10;
const PTS_TEMPLE = 15;

const COINS_START = 30;
const COINS_PER_LEVEL = 15;

// ============================================================
// TYPES
// ============================================================
export type DayKey = string;
export type WeekKey = string;

export type DailyFlags = {
  morningPrayer: boolean;
  eveningPrayer: boolean;
  scripture: boolean;
  services: number;
  sleepAwardApplied: boolean;
};

export type WeeklyFlags = {
  church: boolean;
  mutual: boolean;
  temple: boolean;
};

export type SleepState = {
  currentStart?: number;
  lastSessionMs?: number;
  lastSessionDayKey?: string;
};

export type StatsState = {
  version: number;
  createdAt: number;
  lastCalcAt: number;

  health: number;
  skillLevel: number;
  coins: number;

  badges: string[];

  byDay: Record<DayKey, DailyFlags>;
  byWeek: Record<WeekKey, WeeklyFlags>;

  sleep: SleepState;

  streaks: {
    morningPrayer: number;
    eveningPrayer: number;
    scripture: number;
  };
};

// ============================================================
// HELPERS (EXPORTED FOR ACTIVITIES SCREEN)
// ============================================================
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// 🔥 FIXED — EXPORT these so ActivitiesScreen uses identical keys
export function normalizeDayKey(ts: number): DayKey {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function normalizeWeekKey(ts: number): WeekKey {
  const d = new Date(ts);
  const year = d.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const diff = (d.getTime() - start.getTime()) / 86400000;
  const week = Math.ceil((diff + start.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Daily/weekly struct creators
const newDaily = (): DailyFlags => ({
  morningPrayer: false,
  eveningPrayer: false,
  scripture: false,
  services: 0,
  sleepAwardApplied: false,
});

const newWeekly = (): WeeklyFlags => ({
  church: false,
  mutual: false,
  temple: false,
});

// Deep clones
const cloneDaily = (d: DailyFlags): DailyFlags => ({ ...d });
const cloneWeekly = (w: WeeklyFlags): WeeklyFlags => ({ ...w });
// ============================================================
// LEVEL-UP + POINT APPLICATION
// ============================================================
function settleLevelUps(s: StatsState): StatsState {
  if (s.health < LEVEL_TRIGGER_PERCENT) return s;

  const over = s.health - LEVEL_TRIGGER_PERCENT;
  const gained = 1 + Math.floor(over / 100);
  const remainder = over % 100;

  return {
    ...s,
    skillLevel: Math.max(0, s.skillLevel + gained),
    coins: s.coins + gained * COINS_PER_LEVEL,
    health: clamp(remainder, 0, 97),
  };
}

function applyPoints(s: StatsState, delta: number): StatsState {
  const next = {
    ...s,
    health: clamp(s.health + delta, 0, 200),
  };
  return settleLevelUps(next);
}

// ============================================================
// TIME DECAY + SLEEP AUTO END LOGIC
// ============================================================
function getActiveOverlapMs(startMs: number, endMs: number) {
  if (endMs <= startMs) return 0;
  let total = 0;
  let cursor = startMs;

  while (cursor < endMs) {
    const d = new Date(cursor);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();

    const activeStart = new Date(y, m, day, 6, 30).getTime();
    const activeEnd = new Date(y, m, day, 21, 0).getTime();
    const dayEnd = new Date(y, m, day + 1).getTime();

    const intervalEnd = Math.min(endMs, dayEnd);
    const overlapStart = Math.max(cursor, activeStart);
    const overlapEnd = Math.min(intervalEnd, activeEnd);

    if (overlapEnd > overlapStart) total += overlapEnd - overlapStart;

    cursor = intervalEnd;
  }

  return total;
}

function nextSixThirty(ts: number) {
  const d = new Date(ts);
  const same = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6, 30).getTime();
  const hour = d.getHours() + d.getMinutes() / 60;

  return hour >= ACTIVE_START_HOUR || ts > same
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 6, 30).getTime()
    : same;
}

function autoEndSleep(s: StatsState, now: number): StatsState {
  if (!s.sleep.currentStart) return s;

  const start = s.sleep.currentStart;
  const autoEnd = nextSixThirty(start);
  if (now < autoEnd) return s;

  const dur = autoEnd - start;
  const hrs = dur / 3600000;
  const dk = normalizeDayKey(autoEnd);

  const updated: StatsState = {
    ...s,
    sleep: {
      lastSessionMs: dur,
      lastSessionDayKey: dk,
      currentStart: undefined,
    },
  };

  return hrs >= SLEEP_THRESHOLD_HOURS
    ? applyPoints(updated, PTS_SLEEP_BONUS)
    : applyPoints(updated, -PTS_SLEEP_PENALTY);
}

function applyDecay(s: StatsState, now: number): StatsState {
  const last = s.lastCalcAt ?? s.createdAt ?? now;
  if (now <= last) return { ...s, lastCalcAt: now };

  const activeMs = getActiveOverlapMs(last, now);
  const hrs = activeMs / 3600000;

  if (hrs <= 0) return { ...s, lastCalcAt: now };

  let next = {
    ...s,
    lastCalcAt: now,
    health: clamp(s.health - hrs * HEALTH_DECAY_PER_ACTIVE_HOUR, 0, 200),
  };

  if (next.health <= 0) {
    next = {
      ...next,
      health: 50,
      skillLevel: Math.max(0, next.skillLevel - 1),
    };
  }

  return next;
}

function advanceTime(s: StatsState, now: number) {
  if (now <= s.lastCalcAt) return s;
  let x = autoEndSleep(s, now);
  x = applyDecay(x, now);
  return x;
}

// ============================================================
// STORAGE KEY
// ============================================================
const STORAGE_KEY = "dt.stats.v9";

// ============================================================
// ACTIONS
// ============================================================
type Action =
  | { type: "LOG_MORNING_PRAYER"; now: number }
  | { type: "LOG_EVENING_PRAYER"; now: number }
  | { type: "LOG_SCRIPTURE"; now: number }
  | { type: "LOG_KINDNESS"; now: number }            // ← fixed
  | { type: "LOG_SERVICE"; now: number }
  | { type: "LOG_WEEKLY"; now: number; kind: keyof WeeklyFlags }
  | { type: "GRANT_BADGE"; badge: string; now: number }
  | { type: "SPEND_COINS"; amount: number; now: number }
  | { type: "START_SLEEP"; now: number }
  | { type: "END_SLEEP"; now: number }
  | { type: "RESET_ALL"; now: number; payload?: StatsState };

// ============================================================
// REDUCER  (FULLY FIXED VERSION)
// ============================================================
function reducer(state: StatsState, action: Action): StatsState {
  if (action.type === "RESET_ALL" && action.payload) {
    return action.payload;
  }

  const now = action.now;
  let s = advanceTime(state, now);

  const dk = normalizeDayKey(now);
  const wk = normalizeWeekKey(now);

  // Clone daily + weekly entries BEFORE modifying
  const day = s.byDay[dk] ? cloneDaily(s.byDay[dk]) : newDaily();
  const week = s.byWeek[wk] ? cloneWeekly(s.byWeek[wk]) : newWeekly();

  s = {
    ...s,
    byDay: { ...s.byDay, [dk]: day },
    byWeek: { ...s.byWeek, [wk]: week },
    streaks: { ...s.streaks },
    sleep: { ...(s.sleep || {}) },
  };

  switch (action.type) {
    case "LOG_MORNING_PRAYER":
      if (!day.morningPrayer) {
        s.byDay[dk].morningPrayer = true;
        s.streaks.morningPrayer++;
        s = applyPoints(s, PTS_MORNING_PRAYER);
      }
      break;

    case "LOG_EVENING_PRAYER":
      if (!day.eveningPrayer) {
        s.byDay[dk].eveningPrayer = true;
        s.streaks.eveningPrayer++;
        s = applyPoints(s, PTS_EVENING_PRAYER);
      }
      break;

    case "LOG_SCRIPTURE":
      if (!day.scripture) {
        s.byDay[dk].scripture = true;
        s.streaks.scripture++;
        s = applyPoints(s, PTS_SCRIPTURE);
      }
      break;

    case "LOG_SERVICE":
      if (day.services < MAX_DAILY_SERVICES) {
        s.byDay[dk].services = day.services + 1;
        s = applyPoints(s, PTS_SERVICE);
      }
      break;

    // 🔥 FIXED — kindness now increments daily services
    case "LOG_KINDNESS":
      if (day.services < MAX_DAILY_SERVICES) {
        s.byDay[dk].services = day.services + 1;
        s = applyPoints(s, PTS_KINDNESS);
      }
      break;

    case "LOG_WEEKLY":
      if (!week[action.kind]) {
        s.byWeek[wk][action.kind] = true;

        const pts =
          action.kind === "church"
            ? PTS_CHURCH
            : action.kind === "mutual"
            ? PTS_MUTUAL
            : PTS_TEMPLE;

        s = applyPoints(s, pts);
      }
      break;

    case "GRANT_BADGE":
      if (!s.badges.includes(action.badge)) {
        s.badges = [...s.badges, action.badge];
        s = applyPoints(s, PTS_BADGE);
      }
      break;

    case "SPEND_COINS":
      if (s.coins >= action.amount) s.coins -= action.amount;
      break;

    case "START_SLEEP":
      if (!s.sleep.currentStart) {
        s.sleep.currentStart = now;
      }
      break;

    case "END_SLEEP":
      if (s.sleep.currentStart) {
        const start = s.sleep.currentStart;
        const dur = now - start;
        const hrs = dur / 3600000;
        const endKey = normalizeDayKey(now);

        s.sleep.lastSessionMs = dur;
        s.sleep.lastSessionDayKey = endKey;
        s.sleep.currentStart = undefined;

        s =
          hrs >= SLEEP_THRESHOLD_HOURS
            ? applyPoints(s, PTS_SLEEP_BONUS)
            : applyPoints(s, -PTS_SLEEP_PENALTY);
      }
      break;

    case "RESET_ALL":
      return {
        version: ENGINE_VERSION,
        createdAt: now,
        lastCalcAt: now,
        health: 50,
        skillLevel: 0,
        coins: COINS_START,
        badges: [],
        byDay: { [dk]: newDaily() },
        byWeek: { [wk]: newWeekly() },
        sleep: {},
        streaks: {
          morningPrayer: 0,
          eveningPrayer: 0,
          scripture: 0,
        },
      };
  }

  return s;
}
// ============================================================
// INITIAL STATE BUILDER
// ============================================================
const buildInitialState = (): StatsState => {
  const now = Date.now();
  const dk = normalizeDayKey(now);
  const wk = normalizeWeekKey(now);

  return {
    version: ENGINE_VERSION,
    createdAt: now,
    lastCalcAt: now,

    health: 50,
    skillLevel: 0,
    coins: COINS_START,

    badges: [],

    byDay: { [dk]: newDaily() },
    byWeek: { [wk]: newWeekly() },

    sleep: {},

    streaks: {
      morningPrayer: 0,
      eveningPrayer: 0,
      scripture: 0,
    },
  };
};

// ============================================================
// CONTEXT API TYPE
// ============================================================
type StatsContextValue = {
  state: StatsState;

  logMorningPrayer: () => void;
  logEveningPrayer: () => void;
  logScripture: () => void;

  logService: () => void;
  logKindness: () => void;

  logWeekly: (kind: keyof WeeklyFlags) => void;

  grantBadge: (badge: string) => void;
  spendCoins: (amount: number) => void;

  resetAll: () => void;
  startSleep: () => void;
  endSleep: () => void;

  applyActivityReward: (activity: string, metadata?: any) => void;
};

// ============================================================
// CONTEXT
// ============================================================
const StatsContext = createContext<StatsContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================
export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { showToast } = useToast();

  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  // ------------------------------------------------------------
  // LOAD FROM STORAGE
  // ------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed: StatsState = JSON.parse(raw);

        // Must match engine version to load
        if (parsed.version === ENGINE_VERSION) {
          dispatch({
            type: "RESET_ALL",
            now: Date.now(),
            payload: parsed,
          });
        }
      } catch (err) {
        console.error("⚠️ Failed to load stats:", err);
      }
    })();
  }, []);

  // ------------------------------------------------------------
  // SAVE TO STORAGE
  // ------------------------------------------------------------
  useEffect(() => {
    if (!state) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.error("⚠️ Failed to save stats:", err)
    );
  }, [state]);

  // ------------------------------------------------------------
  // TOASTS — new badges + level ups
  // ------------------------------------------------------------
  const prevRef = useRef<StatsState | null>(null);

  useEffect(() => {
    const prev = prevRef.current;

    if (prev) {
      if (state.badges.length > prev.badges.length) {
        showToast("A rare badge has been bestowed!");
      }
      if (state.skillLevel > prev.skillLevel) {
        showToast("Your mastery deepens!");
      }
    }

    prevRef.current = state;
  }, [state, showToast]);

  // ------------------------------------------------------------
  // CONTEXT API METHODS
  // ------------------------------------------------------------
  const api: StatsContextValue = useMemo(
    () => ({
      state,

      logMorningPrayer: () =>
        dispatch({ type: "LOG_MORNING_PRAYER", now: Date.now() }),

      logEveningPrayer: () =>
        dispatch({ type: "LOG_EVENING_PRAYER", now: Date.now() }),

      logScripture: () =>
        dispatch({ type: "LOG_SCRIPTURE", now: Date.now() }),

      logService: () =>
        dispatch({ type: "LOG_SERVICE", now: Date.now() }),

      logKindness: () =>
        dispatch({ type: "LOG_KINDNESS", now: Date.now() }),

      logWeekly: (kind: keyof WeeklyFlags) =>
        dispatch({ type: "LOG_WEEKLY", kind, now: Date.now() }),

      grantBadge: (badge: string) =>
        dispatch({ type: "GRANT_BADGE", badge, now: Date.now() }),

      spendCoins: (amount: number) =>
        dispatch({ type: "SPEND_COINS", amount, now: Date.now() }),

      resetAll: () =>
        dispatch({ type: "RESET_ALL", now: Date.now() }),

      startSleep: () =>
        dispatch({ type: "START_SLEEP", now: Date.now() }),

      endSleep: () =>
        dispatch({ type: "END_SLEEP", now: Date.now() }),

      // ------------------------------------------------------------
      // 🔥 Global API used by activityApi → applyActivityReward()
      // ------------------------------------------------------------
      applyActivityReward: (activity: string, metadata?: any) => {
        switch (activity) {
          case "morning_prayer":
            dispatch({ type: "LOG_MORNING_PRAYER", now: Date.now() });
            break;

          case "evening_prayer":
            dispatch({ type: "LOG_EVENING_PRAYER", now: Date.now() });
            break;

          case "scripture":
            dispatch({ type: "LOG_SCRIPTURE", now: Date.now() });
            break;

          case "service":
            dispatch({ type: "LOG_SERVICE", now: Date.now() });
            break;

          case "kindness":
            dispatch({ type: "LOG_KINDNESS", now: Date.now() });
            break;

          case "church":
          case "mutual":
          case "temple":
            dispatch({
              type: "LOG_WEEKLY",
              kind: activity as keyof WeeklyFlags,
              now: Date.now(),
            });
            break;

          case "sleep_start":
            dispatch({ type: "START_SLEEP", now: Date.now() });
            break;

          case "sleep_end":
            dispatch({ type: "END_SLEEP", now: Date.now() });
            break;

          default:
            console.warn("Unknown activity type:", activity);
        }
      },
    }),
    [state]
  );
  // ------------------------------------------------------------
  // GLOBAL BIND — activityApi calls this (server → client)
  // ------------------------------------------------------------
  useEffect(() => {
    (globalThis as any).applyActivityReward = api.applyActivityReward;
  }, [api]);

  // ------------------------------------------------------------
  // PROVIDER OUTPUT
  // ------------------------------------------------------------
  return (
    <StatsContext.Provider value={api}>
      {children}
    </StatsContext.Provider>
  );
};

// ============================================================
// HOOK — useStats()
// ============================================================
export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return ctx;
};
