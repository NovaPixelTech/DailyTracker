import { Router, type IRouter } from "express";
import { db, entriesTable, profileTable } from "@workspace/db";
import { desc, gte } from "drizzle-orm";
import { computeEntryStats } from "../lib/calorie.js";

const router: IRouter = Router();

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function avgOrZero(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const sevenDaysAgo = getDateDaysAgo(7);
  const thirtyDaysAgo = getDateDaysAgo(30);

  const allEntries = await db
    .select()
    .from(entriesTable)
    .orderBy(desc(entriesTable.date));

  const weeklyEntries = allEntries.filter((e) => e.date >= sevenDaysAgo);
  const monthlyEntries = allEntries.filter((e) => e.date >= thirtyDaysAgo);

  const mapStats = (entries: typeof allEntries) =>
    entries.map((e) => computeEntryStats(e));

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
  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date();
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const found = allEntries.find((e) => e.date === dateStr);
    if (!found) break;
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
    if (currentStreak > 365) break;
  }

  res.json({
    weeklyAvgIntake,
    weeklyAvgBurned,
    weeklyAvgNet,
    monthlyAvgIntake,
    monthlyAvgBurned,
    monthlyAvgNet,
    estimatedWeeklyWeightChangeKg,
    totalEntriesCount: allEntries.length,
    currentStreak,
  });
});

router.get("/stats/weekly", async (_req, res): Promise<void> => {
  const sevenDaysAgo = getDateDaysAgo(7);
  const entries = await db
    .select()
    .from(entriesTable)
    .where(gte(entriesTable.date, sevenDaysAgo))
    .orderBy(entriesTable.date);

  res.json(
    entries.map((e) => {
      const stats = computeEntryStats(e);
      return { date: e.date, ...stats };
    })
  );
});

router.get("/stats/monthly", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = getDateDaysAgo(30);
  const entries = await db
    .select()
    .from(entriesTable)
    .where(gte(entriesTable.date, thirtyDaysAgo))
    .orderBy(entriesTable.date);

  res.json(
    entries.map((e) => {
      const stats = computeEntryStats(e);
      return { date: e.date, ...stats };
    })
  );
});

router.get("/stats/weight-trend", async (_req, res): Promise<void> => {
  const [profile] = await db.select().from(profileTable).limit(1);
  const thirtyDaysAgo = getDateDaysAgo(30);
  const entries = await db
    .select()
    .from(entriesTable)
    .where(gte(entriesTable.date, thirtyDaysAgo))
    .orderBy(entriesTable.date);

  const baseWeight = profile?.weightKg ?? 70;
  let cumulativeDeficit = 0;
  const trend = entries.map((e) => {
    const { netCalories } = computeEntryStats(e);
    cumulativeDeficit += netCalories;
    const estimatedWeightKg = Math.round((baseWeight + cumulativeDeficit / 7700) * 100) / 100;
    return {
      date: e.date,
      estimatedWeightKg,
      cumulativeDeficit: Math.round(cumulativeDeficit),
    };
  });

  res.json(trend);
});

router.get("/stats/today-recommendation", async (_req, res): Promise<void> => {
  const [profile] = await db.select().from(profileTable).limit(1);
  if (!profile || !profile.tdee) {
    res.status(404).json({ error: "No profile found" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [todayEntry] = await db
    .select()
    .from(entriesTable)
    .where(gte(entriesTable.date, today));

  const tdee = profile.tdee;
  const targetCalories = tdee + profile.targetCalorieDelta;
  const currentIntake = todayEntry
    ? todayEntry.breakfastKcal + todayEntry.lunchKcal + todayEntry.dinnerKcal + todayEntry.snacksKcal
    : 0;
  const currentBurned = todayEntry
    ? todayEntry.walkingKcal + todayEntry.workoutKcal + todayEntry.otherBurnedKcal
    : 0;

  const netCalories = currentIntake - currentBurned;
  const remainingCalories = targetCalories - netCalories;
  let status = "on_track";
  let message = "";

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

  res.json({
    tdee,
    targetCalories,
    currentIntake,
    currentBurned,
    remainingCalories,
    message,
    status,
    goal: profile.goal,
    netCalories,
  });
});

export default router;
