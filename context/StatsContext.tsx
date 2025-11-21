// ============================================================
// context/StatsContext.tsx — v7.4 (Local Engine + Toast Events)
// Local-only stats engine (health/skill/coins/sleep/streaks)
// Emits toasts on: level up, badge earned, skill increase
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "./ToastContext";

// ============================================================
// ENGINE VERSION
// ============================================================
export const ENGINE_VERSION = 7;

/***** CONFIG *****/
const ACTIVE_START_HOUR = 6.5;
const ACTIVE_END_HOUR = 21;
const HEALTH_DECAY_PER_ACTIVE_HOUR = 50 / 29;

const PTS_MORNING_PRAYER = 6;
const PTS_EVENING_PRAYER = 6;
const PTS_SCRIPTURE = 8;
const PTS_SERVICE = 3;
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
  lastSessionDayKey?: DayKey;
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
// HELPERS
// ============================================================
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

function dayKeyFromTs(ts: number): DayKey {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekKeyFromTs(ts: number): WeekKey {
  const d = new Date(ts);
  const y = d.getFullYear();
  const onejan = new Date(y, 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${y}-W${String(week).padStart(2, "0")}`;
}

const defaultDailyFlags = (): DailyFlags => ({
  morningPrayer: false,
  eveningPrayer: false,
  scripture: false,
  services: 0,
  sleepAwardApplied: false,
});

const defaultWeeklyFlags = (): WeeklyFlags => ({
  church: false,
  mutual: false,
  temple: false,
});

const defaultStreaks = () => ({
  morningPrayer: 0,
  eveningPrayer: 0,
  scripture: 0,
});

// ============================================================
// LEVEL LOGIC
// ============================================================
function settleLevelUps(state: StatsState): StatsState {
  if (state.health < LEVEL_TRIGGER_PERCENT) return state;

  const over = state.health - LEVEL_TRIGGER_PERCENT;
  const gained = 1 + Math.floor(over / 100);
  const remainder = over % 100;

  return {
    ...state,
    skillLevel: state.skillLevel + gained,
    coins: state.coins + gained * COINS_PER_LEVEL,
    health: clamp(remainder, 0, 97),
  };
}

function applyPoints(state: StatsState, delta: number): StatsState {
  const next = {
    ...state,
    health: clamp(state.health + delta, 0, 200),
  };
  return settleLevelUps(next);
}

// ============================================================
// DECAY + SLEEP LOGIC
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
  if (hour >= ACTIVE_START_HOUR || ts > same)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 6, 30).getTime();

  return same;
}

function autoEndSleepIfNeeded(state: StatsState, now: number): StatsState {
  if (!state.sleep.currentStart) return state;

  const start = state.sleep.currentStart;
  const autoEnd = nextSixThirty(start);

  if (now < autoEnd) return state;

  const dur = autoEnd - start;
  const hrs = dur / 3600000;
  const dk = dayKeyFromTs(autoEnd);

  let updated: StatsState = {
    ...state,
    sleep: {
      lastSessionMs: dur,
      lastSessionDayKey: dk,
      currentStart: undefined,
    },
  };

  if (hrs >= SLEEP_THRESHOLD_HOURS) {
    updated = applyPoints(updated, PTS_SLEEP_BONUS);
  } else {
    updated = applyPoints(updated, -PTS_SLEEP_PENALTY);
  }

  return updated;
}

function applyDecayAndCollapse(state: StatsState, now: number) {
  const last = state.lastCalcAt ?? state.createdAt ?? now;
  if (now <= last) return { ...state, lastCalcAt: now };

  const activeMs = getActiveOverlapMs(last, now);
  const hrs = activeMs / 3600000;
  if (hrs <= 0) return { ...state, lastCalcAt: now };

  let decayed = {
    ...state,
    lastCalcAt: now,
    health: clamp(state.health - hrs * HEALTH_DECAY_PER_ACTIVE_HOUR, 0, 200),
  };

  if (decayed.health <= 0) {
    decayed = {
      ...decayed,
      health: 50,
      skillLevel: Math.max(decayed.skillLevel - 1, 1),
    };
  }

  return decayed;
}

function stepTime(state: StatsState, now: number) {
  if (now <= state.lastCalcAt) return state;
  let s = autoEndSleepIfNeeded(state, now);
  return applyDecayAndCollapse(s, now);
}

// ============================================================
// STORAGE KEY
// ============================================================
const STORAGE_KEY = "dt.stats.v7";

// ============================================================
// REDUCER
// ============================================================
type Action =
  | { type: "LOG_MORNING_PRAYER"; now: number }
  | { type: "LOG_EVENING_PRAYER"; now: number }
  | { type: "LOG_SCRIPTURE"; now: number }
  | { type: "LOG_SERVICE"; now: number }
  | { type: "LOG_WEEKLY"; now: number; kind: keyof WeeklyFlags }
  | { type: "GRANT_BADGE"; badge: string; now: number }
  | { type: "SPEND_COINS"; amount: number; now: number }
  | { type: "START_SLEEP"; now: number }
  | { type: "END_SLEEP"; now: number }
  | { type: "RESET_ALL"; now: number; payload?: StatsState };

function reducer(state: StatsState, action: Action): StatsState {
  if (action.type === "RESET_ALL" && action.payload) return action.payload;

  const now = action.now;
  let s = stepTime(state, now);

  const dk = dayKeyFromTs(now);
  const wk = weekKeyFromTs(now);

  s = {
    ...s,
    byDay: { ...s.byDay },
    byWeek: { ...s.byWeek },
    streaks: { ...s.streaks },
    sleep: { ...(s.sleep || {}) },
  };

  const day = s.byDay[dk] || defaultDailyFlags();
  const week = s.byWeek[wk] || defaultWeeklyFlags();
  s.byDay[dk] = { ...day };
  s.byWeek[wk] = { ...week };

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
      if (s.coins >= action.amount) {
        s.coins -= action.amount;
      }
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

        s.sleep.lastSessionMs = dur;
        s.sleep.lastSessionDayKey = dk;
        s.sleep.currentStart = undefined;

        if (hrs >= SLEEP_THRESHOLD_HOURS) {
          s = applyPoints(s, PTS_SLEEP_BONUS);
        } else {
          s = applyPoints(s, -PTS_SLEEP_PENALTY);
        }
      }
      break;

    case "RESET_ALL":
      s = {
        version: ENGINE_VERSION,
        createdAt: now,
        lastCalcAt: now,
        health: 50,
        skillLevel: 0,
        coins: COINS_START,
        badges: [],
        byDay: { [dk]: defaultDailyFlags() },
        byWeek: { [wk]: defaultWeeklyFlags() },
        sleep: {},
        streaks: defaultStreaks(),
      };
      break;
  }

  return s;
}

// ============================================================
// INITIALIZATION
// ============================================================
const buildInitialState = (): StatsState => {
  const now = Date.now();
  const dk = dayKeyFromTs(now);
  const wk = weekKeyFromTs(now);

  return {
    version: ENGINE_VERSION,
    createdAt: now,
    lastCalcAt: now,
    health: 50,
    skillLevel: 0,
    coins: COINS_START,
    badges: [],
    byDay: { [dk]: defaultDailyFlags() },
    byWeek: { [wk]: defaultWeeklyFlags() },
    sleep: {},
    streaks: defaultStreaks(),
  };
};

// ============================================================
// CONTEXT + PROVIDER
// ============================================================
const StatsContext = createContext<any>(null);

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  // Load stored stats
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
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

  // Save stats to storage
  useEffect(() => {
    if (!state) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.error("⚠️ Failed to save stats:", err)
    );
  }, [state]);

  // ============================================================
  // EVENT TOASTS
  // ============================================================
  const prevRef = React.useRef<StatsState | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev) {
      // Badge earned
      if (state.badges.length > prev.badges.length) {
        showToast("A rare badge has been bestowed!");
      }

      // Skill level increased
      if (state.skillLevel > prev.skillLevel) {
        showToast("Your mastery deepens!");
      }
    }
    prevRef.current = state;
  }, [state]);

  const api = useMemo(
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
    }),
    [state]
  );

  return (
    <StatsContext.Provider value={api}>{children}</StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);
