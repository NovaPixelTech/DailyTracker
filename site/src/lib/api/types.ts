/**
 * Local (browser-persisted) replacements for the generated OpenAPI schemas.
 * Shapes are identical to `lib/api-spec/openapi.yaml` so every page keeps the
 * exact same types it had against the HTTP API.
 */
export interface HealthStatus {
  status: string;
}

export interface ErrorResponse {
  error: string;
}

export interface Profile {
  id: number;
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
  targetCalorieDelta: number;
  /** @nullable */
  tdee: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProfileBody {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
  targetCalorieDelta: number;
}

export interface Entry {
  id: number;
  date: string;
  breakfastKcal: number;
  lunchKcal: number;
  dinnerKcal: number;
  snacksKcal: number;
  walkingKcal: number;
  workoutKcal: number;
  otherBurnedKcal: number;
  /** @nullable */
  notes: string | null;
  totalIntake: number;
  totalBurned: number;
  netCalories: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryBody {
  date: string;
  breakfastKcal: number;
  lunchKcal: number;
  dinnerKcal: number;
  snacksKcal: number;
  walkingKcal: number;
  workoutKcal: number;
  otherBurnedKcal: number;
  /** @nullable */
  notes?: string | null;
}

export interface StatsSummary {
  weeklyAvgIntake: number;
  weeklyAvgBurned: number;
  weeklyAvgNet: number;
  monthlyAvgIntake: number;
  monthlyAvgBurned: number;
  monthlyAvgNet: number;
  estimatedWeeklyWeightChangeKg: number;
  totalEntriesCount: number;
  currentStreak: number;
}

export interface DailyStatItem {
  date: string;
  totalIntake: number;
  totalBurned: number;
  netCalories: number;
  status: string;
}

export interface WeightTrendItem {
  date: string;
  estimatedWeightKg: number;
  cumulativeDeficit: number;
}

export interface TodayRecommendation {
  tdee: number;
  targetCalories: number;
  currentIntake: number;
  currentBurned: number;
  remainingCalories: number;
  message: string;
  status: string;
  goal: string;
  netCalories: number;
}

export type ListEntriesParams = {
  startDate?: string;
  endDate?: string;
};