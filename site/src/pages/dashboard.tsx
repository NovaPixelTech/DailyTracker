import { useGetTodayRecommendation, useGetTodayEntry, useGetStatsSummary, useUpsertEntryByDate } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Flame, Utensils, Target, Activity, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: recommendation, isLoading: isRecLoading } = useGetTodayRecommendation();
  const { data: todayEntry, isLoading: isEntryLoading } = useGetTodayEntry();
  const { data: statsSummary, isLoading: isStatsLoading } = useGetStatsSummary();

  const getStatusColor = (status?: string) => {
    if (status === "deficit") return "text-primary";
    if (status === "surplus") return "text-destructive";
    return "text-yellow-600 dark:text-yellow-500";
  };

  const getStatusBgColor = (status?: string) => {
    if (status === "deficit") return "bg-primary/10";
    if (status === "surplus") return "bg-destructive/10";
    return "bg-yellow-100 dark:bg-yellow-900/20";
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  if (isRecLoading || isEntryLoading || isStatsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Link href={`/log/${todayStr}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" />
          Log Today
        </Link>
      </div>

      {recommendation && (
        <Card className={`border-none shadow-sm ${getStatusBgColor(recommendation.status)}`}>
          <CardContent className="p-6">
            <h2 className={`text-xl font-semibold mb-2 ${getStatusColor(recommendation.status)}`}>
              {recommendation.message}
            </h2>
            <div className="flex gap-4 text-sm opacity-90 text-foreground/80">
              <span>Target: <strong>{recommendation.targetCalories} kcal</strong></span>
              <span>Current Net: <strong>{recommendation.netCalories} kcal</strong></span>
              <span>Remaining: <strong>{recommendation.remainingCalories} kcal</strong></span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consumed</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEntry?.totalIntake || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">kcal from meals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Burned</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEntry?.totalBurned || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">kcal from activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Calories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(todayEntry?.status)}`}>
              {todayEntry?.netCalories || 0}
            </div>
            <p className="text-xs text-muted-foreground capitalize mt-1">{todayEntry?.status || "neutral"}</p>
          </CardContent>
        </Card>
      </div>

      {statsSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Avg Intake</p>
                <p className="text-lg font-semibold">{statsSummary.weeklyAvgIntake} kcal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Burned</p>
                <p className="text-lg font-semibold">{statsSummary.weeklyAvgBurned} kcal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Net</p>
                <p className={`text-lg font-semibold ${getStatusColor(statsSummary.weeklyAvgNet < 0 ? "deficit" : statsSummary.weeklyAvgNet > 0 ? "surplus" : "maintenance")}`}>
                  {statsSummary.weeklyAvgNet} kcal
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Weight Change</p>
                <p className="text-lg font-semibold">{statsSummary.estimatedWeeklyWeightChangeKg > 0 ? "+" : ""}{statsSummary.estimatedWeeklyWeightChangeKg.toFixed(2)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
