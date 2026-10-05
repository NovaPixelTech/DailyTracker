import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetEntryByDate, useUpsertEntryByDate, useDeleteEntry, getGetEntryByDateQueryKey } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

const logSchema = z.object({
  breakfastKcal: z.coerce.number().min(0),
  lunchKcal: z.coerce.number().min(0),
  dinnerKcal: z.coerce.number().min(0),
  snacksKcal: z.coerce.number().min(0),
  walkingKcal: z.coerce.number().min(0),
  workoutKcal: z.coerce.number().min(0),
  otherBurnedKcal: z.coerce.number().min(0),
  notes: z.string().nullable().optional(),
});

export default function LogEntry() {
  const [, params] = useRoute("/log/:date");
  const date = params?.date || format(new Date(), "yyyy-MM-dd");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entry, isLoading } = useGetEntryByDate(date, { 
    query: { enabled: !!date, queryKey: getGetEntryByDateQueryKey(date) } 
  });
  
  const upsertEntry = useUpsertEntryByDate();
  const deleteEntry = useDeleteEntry();

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      breakfastKcal: 0,
      lunchKcal: 0,
      dinnerKcal: 0,
      snacksKcal: 0,
      walkingKcal: 0,
      workoutKcal: 0,
      otherBurnedKcal: 0,
      notes: "",
    }
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        breakfastKcal: entry.breakfastKcal,
        lunchKcal: entry.lunchKcal,
        dinnerKcal: entry.dinnerKcal,
        snacksKcal: entry.snacksKcal,
        walkingKcal: entry.walkingKcal,
        workoutKcal: entry.workoutKcal,
        otherBurnedKcal: entry.otherBurnedKcal,
        notes: entry.notes || "",
      });
    }
  }, [entry, form]);

  const onSubmit = (values: z.infer<typeof logSchema>) => {
    upsertEntry.mutate({ date, data: { ...values, date } }, {
      onSuccess: (data) => {
        toast({ title: "Entry saved" });
        queryClient.setQueryData(getGetEntryByDateQueryKey(date), data);
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Failed to save entry", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      deleteEntry.mutate({ date }, {
        onSuccess: () => {
          toast({ title: "Entry deleted" });
          setLocation("/history");
        },
        onError: () => {
          toast({ title: "Failed to delete entry", variant: "destructive" });
        }
      });
    }
  };

  const displayDate = () => {
    try {
      return format(parseISO(date), "EEEE, MMMM d, yyyy");
    } catch {
      return date;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Entry</h1>
          <p className="text-muted-foreground mt-1">{displayDate()}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="text-lg">Food Intake (kcal)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField control={form.control} name="breakfastKcal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breakfast</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lunchKcal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunch</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dinnerKcal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dinner</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="snacksKcal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Snacks & Drinks</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="text-lg text-primary">Activity Burned (kcal)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <FormField control={form.control} name="walkingKcal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Walking / Steps</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="workoutKcal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workout / Exercise</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="otherBurnedKcal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Burned</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes / Journal</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How did you feel today?" className="resize-none" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={!entry || deleteEntry.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entry
            </Button>
            
            <div className="space-x-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/")}>Cancel</Button>
              <Button type="submit" disabled={upsertEntry.isPending}>
                {upsertEntry.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
