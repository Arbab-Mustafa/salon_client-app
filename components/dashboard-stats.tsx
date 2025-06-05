"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import SalesTablesDialog from "./sales-tables-dialog";
import { startOfDay, endOfDay, addDays, addMonths } from "date-fns";

function getDateRange(period: string, today: Date) {
  const startDate = startOfDay(today);
  let endDate = endOfDay(today);
  if (period === "week") endDate = endOfDay(addDays(startDate, 6));
  if (period === "month") endDate = endOfDay(addMonths(startDate, 1));
  return { startDate, endDate };
}

async function fetchSalesTotal(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const res = await fetch("/api/reports/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate }),
  });
  const data = await res.json();
  return data.total || 0;
}

export default function DashboardStats() {
  const [todaySales, setTodaySales] = useState(0);
  const [yesterdaySales, setYesterdaySales] = useState(0);
  const [weeklySales, setWeeklySales] = useState(0);
  const [lastWeekSales, setLastWeekSales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [lastMonthSales, setLastMonthSales] = useState(0);
  const [yearlySales, setYearlySales] = useState(0);
  const [lastYearSales, setLastYearSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    startDate: Date;
    endDate: Date;
    title: string;
    period: "day" | "week" | "month" | "year";
  }>({
    startDate: new Date(),
    endDate: new Date(),
    title: "",
    period: "day",
  });

  // Force refresh when component mounts and every minute
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    // Initial load
    updateStats();

    // Set up interval to refresh every minute
    const intervalId = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Update stats when forceUpdate changes
  useEffect(() => {
    updateStats();
  }, [setForceUpdate]);

  const updateStats = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const { startDate: todayStart, endDate: todayEnd } = getDateRange(
        "day",
        today
      );
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const { startDate: yesterdayStart, endDate: yesterdayEnd } = getDateRange(
        "day",
        yesterday
      );
      const { startDate: weekStart, endDate: weekEnd } = getDateRange(
        "week",
        today
      );
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { startDate: lastWeekStart, endDate: lastWeekEnd } = getDateRange(
        "week",
        lastWeek
      );
      const { startDate: monthStart, endDate: monthEnd } = getDateRange(
        "month",
        today
      );
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const { startDate: lastMonthStart, endDate: lastMonthEnd } = getDateRange(
        "month",
        lastMonth
      );
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(
        today.getFullYear() - 1,
        11,
        31,
        23,
        59,
        59,
        999
      );

      const [
        todayTotal,
        yesterdayTotal,
        weekTotal,
        lastWeekTotal,
        monthTotal,
        lastMonthTotal,
        yearTotal,
        lastYearTotal,
      ] = await Promise.all([
        fetchSalesTotal(todayStart, todayEnd),
        fetchSalesTotal(yesterdayStart, yesterdayEnd),
        fetchSalesTotal(weekStart, weekEnd),
        fetchSalesTotal(lastWeekStart, lastWeekEnd),
        fetchSalesTotal(monthStart, monthEnd),
        fetchSalesTotal(lastMonthStart, lastMonthEnd),
        fetchSalesTotal(yearStart, yearEnd),
        fetchSalesTotal(lastYearStart, lastYearEnd),
      ]);

      setTodaySales(todayTotal);
      setYesterdaySales(yesterdayTotal);
      setWeeklySales(weekTotal);
      setLastWeekSales(lastWeekTotal);
      setMonthlySales(monthTotal);
      setLastMonthSales(lastMonthTotal);
      setYearlySales(yearTotal);
      setLastYearSales(lastYearTotal);
    } catch (error) {
      console.error("Error updating dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate percentage changes
  const todayChange =
    yesterdaySales === 0
      ? 100
      : ((todaySales - yesterdaySales) / yesterdaySales) * 100;
  const weekChange =
    lastWeekSales === 0
      ? 100
      : ((weeklySales - lastWeekSales) / lastWeekSales) * 100;
  const monthChange =
    lastMonthSales === 0
      ? 100
      : ((monthlySales - lastMonthSales) / lastMonthSales) * 100;
  const yearChange =
    lastYearSales === 0
      ? 100
      : ((yearlySales - lastYearSales) / lastYearSales) * 100;

  // Handle card click to open dialog
  const handleCardClick = (period: "day" | "week" | "month" | "year") => {
    const today = new Date();
    let startDate: Date, endDate: Date, title: string;

    switch (period) {
      case "day":
        const { startDate: dayStart, endDate: dayEnd } = getDateRange(
          "day",
          today
        );
        startDate = dayStart;
        endDate = dayEnd;
        title = "Today's Sales";
        break;
      case "week":
        const { startDate: weekStart, endDate: weekEnd } = getDateRange(
          "week",
          today
        );
        startDate = weekStart;
        endDate = weekEnd;
        title = "Weekly Revenue";
        break;
      case "month":
        const { startDate: monthStart, endDate: monthEnd } = getDateRange(
          "month",
          today
        );
        startDate = monthStart;
        endDate = monthEnd;
        title = "Monthly Revenue";
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        title = "Yearly Revenue";
        break;
    }

    setDialogData({ startDate, endDate, title, period });
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading dashboard stats...</div>;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("day")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Today's Sales
            </CardTitle>
            {todayChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {todayChange >= 0 ? "+" : ""}
              {todayChange.toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card
          className="border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("week")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Weekly Revenue
            </CardTitle>
            {weekChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{weeklySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {weekChange >= 0 ? "+" : ""}
              {weekChange.toFixed(1)}% from last week
            </p>
          </CardContent>
        </Card>
        <Card
          className="border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("month")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Monthly Revenue
            </CardTitle>
            {monthChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{monthlySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {monthChange >= 0 ? "+" : ""}
              {monthChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card
          className="border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("year")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Yearly Revenue
            </CardTitle>
            {yearChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{yearlySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {yearChange >= 0 ? "+" : ""}
              {yearChange.toFixed(1)}% from last year
            </p>
          </CardContent>
        </Card>
      </div>
      <SalesTablesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        startDate={dialogData.startDate}
        endDate={dialogData.endDate}
        title={dialogData.title}
        period={dialogData.period}
      />
    </>
  );
}
