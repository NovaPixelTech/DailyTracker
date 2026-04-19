export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
  activityLevel: string
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
}): { totalIntake: number; totalBurned: number; netCalories: number; status: string } {
  const totalIntake = entry.breakfastKcal + entry.lunchKcal + entry.dinnerKcal + entry.snacksKcal;
  const totalBurned = entry.walkingKcal + entry.workoutKcal + entry.otherBurnedKcal;
  const netCalories = totalIntake - totalBurned;
  let status = "maintenance";
  if (netCalories < 0) status = "deficit";
  else if (netCalories > 0) status = "surplus";
  return { totalIntake, totalBurned, netCalories, status };
}

export function formatEntry(raw: {
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
  createdAt: Date;
  updatedAt: Date;
}) {
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
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}
