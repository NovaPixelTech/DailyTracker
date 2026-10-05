/**
 * Browser-persisted data layer.
 *
 * This is a drop-in replacement for the Postgres/Drizzle storage used by
 * `artifacts/api-server`. Every read and write mirrors the original server
 * route behaviour exactly (same date math, same derived values, same
 * not-found cases), but the data lives in `localStorage` so the app works as a
 * fully static site on GitHub Pages.
 */
import type {
  CreateEntryBody,
  DailyStatItem,
  Entry,
  Profile,
  StatsSummary,
  TodayRecommendation,
  UpsertProfileBody,
  WeightTrendItem,
} from "./types";

const PROFILE_KEY = "caltrack.profile";
const ENTRIES_KEY = "caltrack.entries";

interface StoredProfile extends Profile {}

interface StoredEntry {
  id: number;
  date: string;
  breakfastKcal: number;
  lunchKcal: number;
  dinnerKcal: number;
  snacksKcal: number;
  walkingKcal: number;
  workoutKcal: number;
  otherBurnedKcal: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Persistence primitives
// ---------------------------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: fail silently, the app still renders.
  }
}

function loadProfile(): StoredProfile | null {
  return readJson<StoredProfile | null>(PROFILE_KEY, null);
}

function saveProfile(profile: StoredProfile): StoredProfile {
  writeJson(PROFILE_KEY, profile);
  return profile;
}

function loadEntries(): StoredEntry[] {
  const rows = readJson<StoredEntry[]>(ENTRIES_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function saveEntries(entries: StoredEntry[]): void {
  writeJson(ENTRIES_KEY, entries);
}

// ---------------------------------------------------------------------------
// Domain logic — ported verbatim from artifacts/api-server/src/lib/calorie.ts
// ---------------------------------------------------------------------------

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string,
): number {
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = multipliers[activityLevel] ?? 1.55;
  return Math.round(bmr * multiplier);
}

export function computeEntryStats(entry: {
  breakfastKcal: number;
  lunchKcal: number;
  dinnerKcal: number;
  snacksKcal: number;
  walkingKcal: number;
  workoutKcal: number;
  otherBurnedKcal: number;
}): {
  totalIntake: number;
  totalBurned: number;
  netCalories: number;
  status: string;
} {
  const totalIntake =
    entry.breakfastKcal + entry.lunchKcal + entry.dinnerKcal + entry.snacksKcal;
  const totalBurned =
    entry.walkingKcal + entry.workoutKcal + entry.otherBurnedKcal;
  const netCalories = totalIntake - totalBurned;
  let status = "maintenance";
  if (netCalories < 0) status = "deficit";
  else if (netCalories > 0) status = "surplus";
  return { totalIntake, totalBurned, netCalories, status };
}

export function formatEntry(raw: StoredEntry): Entry {
  const stats = computeEntryStats(raw);
  return {
    id: raw.id,
    date: raw.date,
    breakfastKcal: raw.breakfastKcal,
    lunchKcal: raw.lunchKcal,
    dinnerKcal: raw.dinnerKcal,
    snacksKcal: raw.snacksKcal,
    walkingKcal: raw.walkingKcal,
    workoutKcal: raw.workoutKcal,
    otherBurnedKcal: raw.otherBurnedKcal,
    notes: raw.notes,
    ...stats,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function avgOrZero(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// ---------------------------------------------------------------------------
// Route equivalents
// ---------------------------------------------------------------------------

/** GET /healthz */
export function healthCheck() {
  return { status: "ok" };
}

/** GET /profile */
export function getProfile(): Profile {
  const profile = loadProfile();
  if (!profile) {
    throw new LocalApiError(404, "Profile not found");
  }
  return profile;
}

/** PUT /profile */
export function upsertProfile(data: UpsertProfileBody): Profile {
  const tdee = calculateTDEE(
    data.weightKg,
    data.heightCm,
    data.age,
    data.gender,
    data.activityLevel,
  );

  const existing = loadProfile();
  const now = new Date().toISOString();

  const profile: StoredProfile = {
    id: existing?.id ?? 1,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    age: data.age,
    gender: data.gender,
    activityLevel: data.activityLevel,
    goal: data.goal,
    targetCalorieDelta: data.targetCalorieDelta,
    tdee,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return saveProfile(profile);
}

/** GET /entries */
export function listEntries(params?: {
  startDate?: string;
  endDate?: string;
}): Entry[] {
  const rows = loadEntries();
  const filtered = rows.filter((e) => {
    if (params?.startDate && e.date < params.startDate) return false;
    if (params?.endDate && e.date > params.endDate) return false;
    return true;
  });
  return filtered
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map(formatEntry);
}

/** GET /entries/today */
export function getTodayEntry(): Entry {
  const today = new Date().toISOString().split("T")[0];
  const row = loadEntries().find((e) => e.date === today);
  if (!row) {
    throw new LocalApiError(404, "No entry for today");
  }
  return formatEntry(row);
}

/** GET /entries/{date} */
export function getEntryByDate(date: string): Entry {
  const row = loadEntries().find((e) => e.date === date);
  if (!row) {
    throw new LocalApiError(404, "Entry not found");
  }
  return formatEntry(row);
}

/** PUT /entries/{date} */
export function upsertEntryByDate(
  date: string,
  data: CreateEntryBody,
): Entry {
  const entries = loadEntries();
  const existingIndex = entries.findIndex((e) => e.date === date);
  const now = new Date().toISOString();

  const next: StoredEntry = {
    id:
      existingIndex >= 0
        ? entries[existingIndex].id
        : nextEntryId(entries),
    date,
    breakfastKcal: data.breakfastKcal,
    lunchKcal: data.lunchKcal,
    dinnerKcal: data.dinnerKcal,
    snacksKcal: data.snacksKcal,
    walkingKcal: data.walkingKcal,
    workoutKcal: data.workoutKcal,
    otherBurnedKcal: data.otherBurnedKcal,
    notes: data.notes ?? null,
    createdAt:
      existingIndex >= 0 ? entries[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = next;
  } else {
    entries.push(next);
  }

  saveEntries(entries);
  return formatEntry(next);
}

/** DELETE /entries/{date} */
export function deleteEntry(date: string): void {
  const entries = loadEntries().filter((e) => e.date !== date);
  saveEntries(entries);
}

function nextEntryId(entries: StoredEntry[]): number {
  return entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
}

/** GET /stats/summary */
export function getStatsSummary(): StatsSummary {
  const sevenDaysAgo = getDateDaysAgo(7);
  const thirtyDaysAgo = getDateDaysAgo(30);

  const allEntries = loadEntries().sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );

  const weeklyEntries = allEntries.filter((e) => e.date >= sevenDaysAgo);
  const monthlyEntries = allEntries.filter((e) => e.date >= thirtyDaysAgo);

  const mapStats = (rows: StoredEntry[]) => rows.map((e) => computeEntryStats(e));

  const weeklyStats = mapStats(weeklyEntries);
  const monthlyStats = mapStats(monthlyEntries);

  const weeklyAvgIntake = avgOrZero(weeklyStats.map((s) => s.totalIntake));
  const weeklyAvgBurned = avgOrZero(weeklyStats.map((s) => s.totalBurned));
  const weeklyAvgNet = avgOrZero(weeklyStats.map((s) => s.netCalories));
  const monthlyAvgIntake = avgOrZero(monthlyStats.map((s) => s.totalIntake));
  const monthlyAvgBurned = avgOrZero(monthlyStats.map((s) => s.totalBurned));
  const monthlyAvgNet = avgOrZero(monthlyStats.map((s) => s.netCalories));

  const estimatedWeeklyWeightChangeKg =
    weeklyStats.length > 0
      ? Math.round(((weeklyAvgNet * 7) / 7700) * 1000) / 1000
      : 0;

  let currentStreak = 0;
  const checkDate = new Date();
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const found = allEntries.find((e) => e.date === dateStr);
    if (!found) break;
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
    if (currentStreak > 365) break;
  }

  return {
    weeklyAvgIntake,
    weeklyAvgBurned,
    weeklyAvgNet,
    monthlyAvgIntake,
    monthlyAvgBurned,
    monthlyAvgNet,
    estimatedWeeklyWeightChangeKg,
    totalEntriesCount: allEntries.length,
    currentStreak,
  };
}

function dailyStats(daysAgo: number): DailyStatItem[] {
  const cutoff = getDateDaysAgo(daysAgo);
  return loadEntries()
    .filter((e) => e.date >= cutoff)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => ({ date: e.date, ...computeEntryStats(e) }));
}

/** GET /stats/weekly */
export function getWeeklyStats(): DailyStatItem[] {
  return dailyStats(7);
}

/** GET /stats/monthly */
export function getMonthlyStats(): DailyStatItem[] {
  return dailyStats(30);
}

/** GET /stats/weight-trend */
export function getWeightTrend(): WeightTrendItem[] {
  const profile = loadProfile();
  const cutoff = getDateDaysAgo(30);

  const entries = loadEntries()
    .filter((e) => e.date >= cutoff)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const baseWeight = profile?.weightKg ?? 70;
  let cumulativeDeficit = 0;

  return entries.map((e) => {
    const { netCalories } = computeEntryStats(e);
    cumulativeDeficit += netCalories;
    return {
      date: e.date,
      estimatedWeightKg:
        Math.round((baseWeight + cumulativeDeficit / 7700) * 100) / 100,
      cumulativeDeficit: Math.round(cumulativeDeficit),
    };
  });
}

/** GET /stats/today-recommendation */
export function getTodayRecommendation(): TodayRecommendation {
  const profile = loadProfile();
  if (!profile || !profile.tdee) {
    throw new LocalApiError(404, "No profile found");
  }

  const today = new Date().toISOString().split("T")[0];
  const todayEntry = loadEntries().find((e) => e.date === today);

  const tdee = profile.tdee;
  const targetCalories = tdee + profile.targetCalorieDelta;
  const currentIntake = todayEntry
    ? todayEntry.breakfastKcal +
      todayEntry.lunchKcal +
      todayEntry.dinnerKcal +
      todayEntry.snacksKcal
    : 0;
  const currentBurned = todayEntry
    ? todayEntry.walkingKcal +
      todayEntry.workoutKcal +
      todayEntry.otherBurnedKcal
    : 0;

  const netCalories = currentIntake - currentBurned;
  const remainingCalories = targetCalories - netCalories;

  let status: string;
  let message: string;

  if (remainingCalories > 0) {
    message = `You can eat ${remainingCalories} more kcal today`;
    status = "can_eat_more";
  } else if (remainingCalories < 0) {
    message = `You need to burn ${Math.abs(remainingCalories)} more kcal to reach your goal`;
    status = "need_to_burn";
  } else {
    message = "You have reached your calorie goal for today";
    status = "on_track";
  }

  return {
    tdee,
    targetCalories,
    currentIntake,
    currentBurned,
    remainingCalories,
    message,
    status,
    goal: profile.goal,
    netCalories,
  };
}

// ---------------------------------------------------------------------------
// Error type mirroring ApiError from the HTTP client
// ---------------------------------------------------------------------------

export class LocalApiError extends Error {
  readonly status: number;
  readonly data: { error: string } | null;

  constructor(status: number, message: string) {
    super(`HTTP ${status}: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ApiError";
    this.status = status;
    this.data = { error: message };
  }
}