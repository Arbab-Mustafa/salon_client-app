"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import SalesTablesDialog from "./sales-tables-dialog";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";

interface SalesDialogState {
  show: boolean;
  startDate: Date;
  endDate: Date;
  title: string;
  period: "day" | "week" | "month" | "year";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSalesDialog, setShowSalesDialog] = useState<SalesDialogState>({
    show: false,
    startDate: new Date(),
    endDate: new Date(),
    title: "",
    period: "day",
  });

  // Calculate date ranges
  const now = new Date();
  const todayRange = {
    start: new Date(now.setHours(0, 0, 0, 0)),
    end: new Date(now.setHours(23, 59, 59, 999)),
  };
  const yesterdayRange = {
    start: new Date(now.setDate(now.getDate() - 1)),
    end: new Date(now.setHours(23, 59, 59, 999)),
  };
  const weeklyRange = {
    start: startOfWeek(now, { weekStartsOn: 0 }), // Start from Sunday
    end: endOfWeek(now, { weekStartsOn: 0 }), // End on Saturday
  };
  const lastWeekRange = {
    start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }),
    end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }),
  };
  const monthlyRange = {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
  const lastMonthRange = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
  };
  const yearlyRange = {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
  };
  const lastYearRange = {
    start: new Date(now.getFullYear() - 1, 0, 1),
    end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
  };

  // Calculate percentage changes
  const todayChange = yesterdaySales
    ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
    : 0;
  const weeklyChange = lastWeekSales
    ? ((weeklySales - lastWeekSales) / lastWeekSales) * 100
    : 0;
  const monthlyChange = lastMonthSales
    ? ((monthlySales - lastMonthSales) / lastMonthSales) * 100
    : 0;
  const yearlyChange = lastYearSales
    ? ((yearlySales - lastYearSales) / lastYearSales) * 100
    : 0;

  const fetchSalesTotal = async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch("/api/reports/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }

      const data = await response.json();
      return data.total || 0;
    } catch (err) {
      console.error("Error fetching sales:", err);
      return 0;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          todayTotal,
          yesterdayTotal,
          weeklyTotal,
          lastWeekTotal,
          monthlyTotal,
          lastMonthTotal,
          yearlyTotal,
          lastYearTotal,
        ] = await Promise.all([
          fetchSalesTotal(todayRange.start, todayRange.end),
          fetchSalesTotal(yesterdayRange.start, yesterdayRange.end),
          fetchSalesTotal(weeklyRange.start, weeklyRange.end),
          fetchSalesTotal(lastWeekRange.start, lastWeekRange.end),
          fetchSalesTotal(monthlyRange.start, monthlyRange.end),
          fetchSalesTotal(lastMonthRange.start, lastMonthRange.end),
          fetchSalesTotal(yearlyRange.start, yearlyRange.end),
          fetchSalesTotal(lastYearRange.start, lastYearRange.end),
        ]);

        setTodaySales(todayTotal);
        setYesterdaySales(yesterdayTotal);
        setWeeklySales(weeklyTotal);
        setLastWeekSales(lastWeekTotal);
        setMonthlySales(monthlyTotal);
        setLastMonthSales(lastMonthTotal);
        setYearlySales(yearlyTotal);
        setLastYearSales(lastYearTotal);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-pink-800">
                £{todaySales.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium ${
                  todayChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {todayChange >= 0 ? "+" : ""}
                {todayChange.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs. {format(yesterdayRange.start, "MMM d")}
            </p>
            <Button
              variant="ghost"
              className="w-full mt-2 text-xs text-pink-800 hover:text-pink-900 hover:bg-pink-50"
              onClick={() =>
                setShowSalesDialog({
                  show: true,
                  startDate: todayRange.start,
                  endDate: todayRange.end,
                  title: "Today's Sales",
                  period: "day",
                })
              }
            >
              View Details
            </Button>
          </CardContent>
        </Card>

        {/* This Week's Revenue */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              This Week's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-pink-800">
                £{weeklySales.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium ${
                  weeklyChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {weeklyChange >= 0 ? "+" : ""}
                {weeklyChange.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {format(weeklyRange.start, "MMM d")} -{" "}
              {format(weeklyRange.end, "MMM d")}
            </p>
            <Button
              variant="ghost"
              className="w-full mt-2 text-xs text-pink-800 hover:text-pink-900 hover:bg-pink-50"
              onClick={() =>
                setShowSalesDialog({
                  show: true,
                  startDate: weeklyRange.start,
                  endDate: weeklyRange.end,
                  title: "This Week's Sales",
                  period: "week",
                })
              }
            >
              View Details
            </Button>
          </CardContent>
        </Card>

        {/* This Month's Revenue */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              This Month's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-pink-800">
                £{monthlySales.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium ${
                  monthlyChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {monthlyChange >= 0 ? "+" : ""}
                {monthlyChange.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {format(monthlyRange.start, "MMM d")} -{" "}
              {format(monthlyRange.end, "MMM d")}
            </p>
            <Button
              variant="ghost"
              className="w-full mt-2 text-xs text-pink-800 hover:text-pink-900 hover:bg-pink-50"
              onClick={() =>
                setShowSalesDialog({
                  show: true,
                  startDate: monthlyRange.start,
                  endDate: monthlyRange.end,
                  title: "This Month's Sales",
                  period: "month",
                })
              }
            >
              View Details
            </Button>
          </CardContent>
        </Card>

        {/* This Year's Revenue */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              This Year's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-pink-800">
                £{yearlySales.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium ${
                  yearlyChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {yearlyChange >= 0 ? "+" : ""}
                {yearlyChange.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {format(yearlyRange.start, "yyyy")}
            </p>
            <Button
              variant="ghost"
              className="w-full mt-2 text-xs text-pink-800 hover:text-pink-900 hover:bg-pink-50"
              onClick={() =>
                setShowSalesDialog({
                  show: true,
                  startDate: yearlyRange.start,
                  endDate: yearlyRange.end,
                  title: "This Year's Sales",
                  period: "year",
                })
              }
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sales Dialog */}
      {showSalesDialog.show && (
        <SalesTablesDialog
          open={showSalesDialog.show}
          onOpenChange={(open) =>
            setShowSalesDialog((prev) => ({ ...prev, show: open }))
          }
          startDate={showSalesDialog.startDate}
          endDate={showSalesDialog.endDate}
          title={showSalesDialog.title}
          period={showSalesDialog.period}
        />
      )}
    </div>
  );
}
