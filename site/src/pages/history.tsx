import { useState } from "react";
import { useListEntries } from "@/lib/api";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function History() {
  const { data: entries, isLoading } = useListEntries();
  const [, setLocation] = useLocation();

  const handleExportCSV = () => {
    if (!entries || entries.length === 0) return;
    
    const headers = ["Date", "Intake (kcal)", "Burned (kcal)", "Net (kcal)", "Status", "Notes"];
    const rows = entries.map(e => [
      e.date,
      e.totalIntake,
      e.totalBurned,
      e.netCalories,
      e.status,
      `"${(e.notes || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `caltrack-history-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    if (status === "deficit") return <Badge className="bg-primary hover:bg-primary/80">Deficit</Badge>;
    if (status === "surplus") return <Badge variant="destructive">Surplus</Badge>;
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100">Maintenance</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground mt-1">Review your past logs</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={!entries?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Intake</TableHead>
                <TableHead className="text-right">Burned</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : entries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No entries found.
                  </TableCell>
                </TableRow>
              ) : (
                entries?.map((entry) => (
                  <TableRow 
                    key={entry.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setLocation(`/log/${entry.date}`)}
                  >
                    <TableCell className="font-medium">{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{entry.totalIntake} kcal</TableCell>
                    <TableCell className="text-right text-muted-foreground">{entry.totalBurned} kcal</TableCell>
                    <TableCell className="text-right font-semibold">{entry.netCalories} kcal</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <ChevronRight className="h-4 w-4 inline" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
