"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import SalesTablesDialog from "./sales-tables-dialog";
import { format } from "date-fns";

function getDateRange(period: string, today: Date) {
  const startDate = new Date(today);
  let endDate = new Date(today);

  switch (period) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      // Get the start of the week (Sunday)
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      // Set end date to 6 days after start
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      // Set to first day of current month
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      // Set to last day of current month
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "year":
      // Set to first day of current year
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      // Set to last day of current year
      endDate = new Date(startDate.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
}

async function fetchSalesTotal(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const res = await fetch("/api/reports/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data.totalRevenue || 0;
  } catch (error) {
    console.error("Error fetching sales total:", error);
    return 0;
  }
}

interface Transaction {
  _id: string;
  date: string;
  total: number;
  paymentMethod: string;
  customer?: {
    name: string;
  };
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
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    cardPayments: number;
    cashPayments: number;
  }>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    cardPayments: 0,
    cashPayments: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState("today");

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

  const renderTransactionList = () => {
    if (!transactions.length) return null;

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between p-2 bg-white rounded-lg shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-600 font-semibold">
                      {transaction.customer?.name?.[0] || "?"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.customer?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(transaction.date), "PPP")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">£{transaction.total.toFixed(2)}</p>
                <p className="text-sm text-gray-500">
                  {transaction.paymentMethod}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
