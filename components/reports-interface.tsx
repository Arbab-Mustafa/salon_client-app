"use client";

import { useEffect, useState, useMemo } from "react";
import { format, startOfDay, endOfDay, addDays, addMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Download,
  Printer,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/types/services";

// Helper for date range
function getDateRange(period: string, today: Date) {
  const startDate = startOfDay(today);
  let endDate = endOfDay(today);
  if (period === "week") endDate = endOfDay(addDays(startDate, 6));
  if (period === "month") endDate = endOfDay(addMonths(startDate, 1));
  return { startDate, endDate };
}

type ReportType = "therapist" | "customer" | "service" | "transaction";
type TimePeriod = "day" | "week" | "month" | "custom";

type TransactionItem = {
  name: string;
  category: string;
  price: number;
  quantity: number;
  discount: number;
};
type Transaction = {
  _id: string;
  date: string;
  customer: { id: string; name: string };
  therapist: { id: string; name: string };
  items: TransactionItem[];
  paymentMethod: string;
};

export default function ReportsInterface() {
  // Report filters
  const [reportType, setReportType] = useState<ReportType>("therapist");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day");
  const [therapistFilter, setTherapistFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "amount",
    direction: "desc",
  });

  // Date range
  const today = new Date();
  const [dateRange, setDateRange] = useState(() => getDateRange("day", today));

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uniqueFilters, setUniqueFilters] = useState<{
    therapists: string[];
    customers: string[];
    categories: string[];
  }>({ therapists: [], customers: [], categories: [] });

  // Fetch data
  useEffect(() => {
    fetch("/api/reports/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        therapistId: therapistFilter,
        customerId: customerFilter,
        category: categoryFilter,
      }),
    })
      .then((res) => res.json())
      .then(setTransactions);

    fetch("/api/reports/unique")
      .then((res) => res.json())
      .then(setUniqueFilters);
  }, [dateRange, therapistFilter, customerFilter, categoryFilter]);

  // Aggregation
  const revenueByTherapist = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    transactions.forEach((tx) => {
      const therapist = tx.therapist?.name || "Unknown";
      tx.items.forEach((item) => {
        if (!map[therapist]) map[therapist] = { amount: 0, count: 0 };
        map[therapist].amount +=
          item.price * item.quantity - (item.discount || 0);
        map[therapist].count += item.quantity;
      });
    });
    return map;
  }, [transactions]);

  const revenueByCustomer = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    transactions.forEach((tx) => {
      const customer = tx.customer?.name || "Unknown";
      tx.items.forEach((item) => {
        if (!map[customer]) map[customer] = { amount: 0, count: 0 };
        map[customer].amount +=
          item.price * item.quantity - (item.discount || 0);
        map[customer].count += item.quantity;
      });
    });
    return map;
  }, [transactions]);

  const revenueByService = useMemo(() => {
    const map: Record<
      string,
      { amount: number; count: number; category: string }
    > = {};
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (!map[item.name])
          map[item.name] = { amount: 0, count: 0, category: item.category };
        map[item.name].amount +=
          item.price * item.quantity - (item.discount || 0);
        map[item.name].count += item.quantity;
      });
    });
    return map;
  }, [transactions]);

  const transactionList = useMemo(() => {
    return transactions.flatMap((tx) =>
      tx.items.map((item) => ({
        id: tx._id,
        date: tx.date,
        customer: tx.customer?.name,
        therapist: tx.therapist?.name,
        service: item.name,
        category: item.category,
        amount: item.price * item.quantity,
        discount: item.discount || 0,
        paymentMethod: tx.paymentMethod,
      }))
    );
  }, [transactions]);

  // Summary
  const totalRevenue = transactionList.reduce(
    (sum, t) => sum + (t.amount - t.discount),
    0
  );
  const totalTransactions = transactionList.length;
  const averageTransaction =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Sorting
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  const getSortedData = (data: any[]) => {
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Date range label
  const dateRangeLabel = useMemo(() => {
    if (timePeriod === "day") {
      return format(dateRange.startDate, "PPPP");
    } else {
      return `${format(dateRange.startDate, "PPPP")} - ${format(
        dateRange.endDate,
        "PPPP"
      )}`;
    }
  }, [timePeriod, dateRange]);

  // Prepare data for tables
  const therapistReportData = useMemo(
    () =>
      Object.entries(revenueByTherapist).map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        average: data.amount / data.count,
      })),
    [revenueByTherapist]
  );
  const customerReportData = useMemo(
    () =>
      Object.entries(revenueByCustomer).map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        average: data.amount / data.count,
      })),
    [revenueByCustomer]
  );
  const serviceReportData = useMemo(
    () =>
      Object.entries(revenueByService).map(([name, data]) => ({
        name,
        category: data.category,
        amount: data.amount,
        count: data.count,
        average: data.amount / data.count,
      })),
    [revenueByService]
  );

  // Update date range when time period changes
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    if (period !== "custom") {
      setDateRange(getDateRange(period, today));
    }
  };

  // Set custom date range
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      setDateRange({ startDate: date, endDate: date });
    } else {
      if (date < dateRange.startDate) {
        setDateRange({ startDate: date, endDate: dateRange.startDate });
      } else {
        setDateRange({ startDate: dateRange.startDate, endDate: date });
      }
    }
  };

  // Filter for search (only for transaction list)
  const filteredTransactionList = useMemo(() => {
    if (!searchQuery) return transactionList;
    return transactionList.filter((t) =>
      [t.customer, t.service, t.therapist].some((field) =>
        (field || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [transactionList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Report Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger className="border-pink-200">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="therapist">Revenue by Therapist</SelectItem>
                <SelectItem value="customer">Revenue by Customer</SelectItem>
                <SelectItem value="service">
                  Revenue by Service/Product
                </SelectItem>
                <SelectItem value="transaction">Transaction List</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={timePeriod}
              onValueChange={(value) =>
                handleTimePeriodChange(value as TimePeriod)
              }
            >
              <SelectTrigger className="border-pink-200">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-pink-200"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.startDate,
                    to: dateRange.endDate,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        startDate: startOfDay(range.from),
                        endDate: range.to
                          ? endOfDay(range.to)
                          : endOfDay(range.from),
                      });
                      if (timePeriod !== "custom") {
                        setTimePeriod("custom");
                      }
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={therapistFilter} onValueChange={setTherapistFilter}>
              <SelectTrigger className="border-pink-200">
                <SelectValue placeholder="All Therapists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Therapists</SelectItem>
                {uniqueFilters.therapists.map((therapist) => (
                  <SelectItem key={therapist} value={therapist}>
                    {therapist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="border-pink-200">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {uniqueFilters.customers.map((customer) => (
                  <SelectItem key={customer} value={customer}>
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-pink-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueFilters.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[
                      category as keyof typeof CATEGORY_LABELS
                    ] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reportType === "transaction" && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8 border-pink-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-pink-600">
              Average Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{averageTransaction.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle>
            {reportType === "therapist"
              ? "Revenue by Therapist"
              : reportType === "customer"
              ? "Revenue by Customer"
              : reportType === "service"
              ? "Revenue by Service/Product"
              : "Transaction List"}
          </CardTitle>
          <CardDescription>{dateRangeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Therapist Report */}
          {reportType === "therapist" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Therapist
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("count")}
                    >
                      Transactions
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("amount")}
                    >
                      Revenue
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("average")}
                    >
                      Average
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedData(therapistReportData).map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      £{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      £{row.average.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {therapistReportData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No data available for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Customer Report */}
          {reportType === "customer" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Customer
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("count")}
                    >
                      Visits
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("amount")}
                    >
                      Spent
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("average")}
                    >
                      Average
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedData(customerReportData).map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      £{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      £{row.average.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {customerReportData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No data available for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Service Report */}
          {reportType === "service" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Service/Product
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("category")}
                    >
                      Category
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("count")}
                    >
                      Quantity
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("amount")}
                    >
                      Revenue
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedData(serviceReportData).map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-pink-50 text-pink-800 hover:bg-pink-50"
                      >
                        {CATEGORY_LABELS[
                          row.category as keyof typeof CATEGORY_LABELS
                        ] || row.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      £{row.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {serviceReportData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No data available for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Transaction List */}
          {reportType === "transaction" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("date")}
                    >
                      Date/Time
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("customer")}
                    >
                      Customer
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("service")}
                    >
                      Service/Product
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("therapist")}
                    >
                      Therapist
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() => handleSort("amount")}
                    >
                      Amount
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedData(filteredTransactionList).map((transaction) => (
                  <TableRow
                    key={
                      transaction.id + transaction.service + transaction.date
                    }
                  >
                    <TableCell>
                      {format(new Date(transaction.date), "dd MMM yyyy")}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.customer}
                    </TableCell>
                    <TableCell>{transaction.service}</TableCell>
                    <TableCell>{transaction.therapist}</TableCell>
                    <TableCell className="text-right">
                      £{(transaction.amount - transaction.discount).toFixed(2)}
                      {transaction.discount > 0 && (
                        <div className="text-xs text-pink-600">
                          Discount: £{transaction.discount.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactionList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No transactions found for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="border-pink-200">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
        <Button variant="outline" size="sm" className="border-pink-200">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
