"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import {
  groupTransactionsByCustomer,
  groupTransactionsByService,
  type TransactionData,
} from "@/data/reports-data";

interface SalesTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date;
  endDate: Date;
  title: string;
  period: "day" | "week" | "month" | "year";
}

interface TransactionItem {
  name: string;
  category?: string;
  price: number;
  quantity: number;
  discount?: number;
}

interface TransactionData {
  _id: string;
  date: string | Date;
  customer?: {
    name: string;
  };
  therapist?: {
    name: string;
  };
  items: TransactionItem[];
  paymentMethod?: string;
}

export default function SalesTablesDialog({
  open,
  onOpenChange,
  startDate,
  endDate,
  title,
  period,
}: SalesTablesDialogProps) {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/reports/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch transactions");
        }
        return res.json();
      })
      .then((data) => setTransactions(data.transactions || []))
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        setError(err.message || "Failed to fetch transactions");
      })
      .finally(() => setLoading(false));
  }, [open, startDate, endDate]);

  // Group transactions by therapist (by therapist.id)
  const therapistData = () => {
    const grouped: Record<
      string,
      {
        name: string;
        totalAmount: number;
        cardAmount: number;
        cashAmount: number;
        transactionCount: number;
      }
    > = {};

    transactions.forEach((transaction) => {
      const therapistId = transaction.therapist?.id || "Unknown";
      if (!grouped[therapistId]) {
        grouped[therapistId] = {
          name: transaction.therapist?.name || "Unknown",
          totalAmount: 0,
          cardAmount: 0,
          cashAmount: 0,
          transactionCount: 0,
        };
      }
      const amount = transaction.total - (transaction.discount || 0);
      grouped[therapistId].totalAmount += amount;
      grouped[therapistId].transactionCount += 1;
      if (transaction.paymentMethod?.toLowerCase() === "card") {
        grouped[therapistId].cardAmount += amount;
      } else {
        grouped[therapistId].cashAmount += amount;
      }
    });

    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  // Group transactions by customer (by customer.id)
  const customerData = () => {
    const grouped: Record<
      string,
      {
        name: string;
        totalAmount: number;
        transactionCount: number;
      }
    > = {};
    transactions.forEach((transaction) => {
      const customerId = transaction.customer?.id || "Unknown";
      if (!grouped[customerId]) {
        grouped[customerId] = {
          name: transaction.customer?.name || "Unknown",
          totalAmount: 0,
          transactionCount: 0,
        };
      }
      const amount = transaction.total - (transaction.discount || 0);
      grouped[customerId].totalAmount += amount;
      grouped[customerId].transactionCount += 1;
    });
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  // Group transactions by service (flatten items)
  const serviceData = () => {
    const grouped: Record<
      string,
      {
        name: string;
        category: string;
        totalAmount: number;
        transactionCount: number;
      }
    > = {};
    transactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const key = item.name + "|" + (item.category || "");
        if (!grouped[key]) {
          grouped[key] = {
            name: item.name,
            category: item.category || "",
            totalAmount: 0,
            transactionCount: 0,
          };
        }
        grouped[key].totalAmount +=
          item.price * item.quantity - (item.discount || 0);
        grouped[key].transactionCount += item.quantity;
      });
    });
    return Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "PPp"); // e.g., "Apr 29, 2021, 9:00 AM"
    } catch (err) {
      return "Invalid date";
    }
  };

  // Get all transactions with their items flattened
  const transactionList = transactions.flatMap((tx) =>
    tx.items.map((item) => ({
      id: tx._id,
      date: tx.date,
      customer: tx.customer?.name || "Unknown",
      therapist: tx.therapist?.name || "Unknown",
      service: item.name,
      category: item.category || "Uncategorized",
      amount: item.price * item.quantity,
      discount: item.discount || 0,
      quantity: item.quantity,
      paymentMethod: tx.paymentMethod || "Unknown",
    }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-pink-800">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            {format(startDate, "PP")} - {format(endDate, "PP")}
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-800"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found for this period
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="transactions" className="text-xs md:text-sm">
                Transactions
              </TabsTrigger>
              <TabsTrigger value="therapists" className="text-xs md:text-sm">
                By Therapist
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-xs md:text-sm">
                By Customer
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs md:text-sm">
                By Service
              </TabsTrigger>
                </TabsList>

            <TabsContent value="transactions" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs md:text-sm"
                  onClick={() => {
                    // Export transactions to CSV
                    const csvContent = [
                      // Header
                      [
                        "Date",
                        "Customer",
                        "Therapist",
                        "Service",
                        "Category",
                        "Quantity",
                        "Amount",
                        "Discount",
                        "Payment Method",
                      ].join(","),
                      // Data rows
                      ...transactionList.map((t) =>
                        [
                          formatDate(t.date),
                          `"${t.customer}"`,
                          `"${t.therapist}"`,
                          `"${t.service}"`,
                          `"${t.category}"`,
                          t.quantity,
                          t.amount.toFixed(2),
                          t.discount.toFixed(2),
                          `"${t.paymentMethod}"`,
                        ].join(",")
                      ),
                    ].join("\n");

                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `transactions_${format(
                      startDate,
                      "yyyy-MM-dd"
                    )}_to_${format(endDate, "yyyy-MM-dd")}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Date
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Customer
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Therapist
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Service
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Category
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Quantity
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Amount
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Discount
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Payment
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionList.map((t, i) => (
                      <TableRow key={`${t.id}-${i}`}>
                        <TableCell className="whitespace-nowrap text-xs md:text-sm">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {t.customer}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {t.therapist}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {t.service}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {t.category}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          {t.quantity}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{t.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{t.discount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {t.paymentMethod}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="therapists" className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Therapist
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Card Payments
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Cash Payments
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Total
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Transactions
                      </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {therapistData().map((therapist) => (
                          <TableRow key={therapist.name}>
                        <TableCell className="text-xs md:text-sm">
                          {therapist.name}
                            </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{therapist.cardAmount.toFixed(2)}
                          </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{therapist.cashAmount.toFixed(2)}
                          </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{therapist.totalAmount.toFixed(2)}
                          </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          {therapist.transactionCount}
                          </TableCell>
                        </TableRow>
                    ))}
                      </TableBody>
                    </Table>
              </div>
                  </TabsContent>

            <TabsContent value="customers" className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Customer
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Total Spent
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Transactions
                      </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerData().map((customer) => (
                          <TableRow key={customer.name}>
                        <TableCell className="text-xs md:text-sm">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{customer.totalAmount.toFixed(2)}
                          </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          {customer.transactionCount}
                          </TableCell>
                        </TableRow>
                    ))}
                      </TableBody>
                    </Table>
              </div>
                  </TabsContent>

            <TabsContent value="services" className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Service/Product
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm">
                        Category
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Total Revenue
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-xs md:text-sm text-right">
                        Count
                      </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceData().map((service) => (
                          <TableRow key={service.name}>
                        <TableCell className="text-xs md:text-sm">
                          {service.name}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {service.category}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          £{service.totalAmount.toFixed(2)}
                          </TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          {service.transactionCount}
                          </TableCell>
                        </TableRow>
                    ))}
                      </TableBody>
                    </Table>
              </div>
                  </TabsContent>
              </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
