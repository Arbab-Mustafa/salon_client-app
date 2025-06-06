import { NextRequest, NextResponse } from "next/server";
import getMongoConnection from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import type { TransactionData } from "@/data/reports-data";
import type { Model } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Ensure we have a MongoDB connection
    await getMongoConnection();

    // Get transactions for the date range
    const transactions = await Transaction.find({
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("customer", "name")
      .populate("therapist", "name")
      .sort({ date: -1 })
      .lean();

    // Calculate summary statistics
    const totalRevenue = transactions.reduce(
      (sum, t) => sum + (t.total - (t.discount || 0)),
      0
    );
    const totalTransactions = transactions.length;
    const averageTransactionValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate payment method breakdown
    const cardPayments = transactions.reduce((sum, t) => {
      if (t.paymentMethod?.toLowerCase() === "card") {
        return sum + (t.total - (t.discount || 0));
      }
      return sum;
    }, 0);

    const cashPayments = transactions.reduce((sum, t) => {
      if (t.paymentMethod?.toLowerCase() !== "card") {
        return sum + (t.total - (t.discount || 0));
      }
      return sum;
    }, 0);

    return NextResponse.json({
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      cardPayments,
      cashPayments,
      transactions: transactions.map((t) => ({
        _id: t._id,
        date: t.date,
        total: t.total,
        discount: t.discount,
        paymentMethod: t.paymentMethod,
        customer: t.customer,
        therapist: t.therapist,
        items: t.items,
      })),
    });
  } catch (error) {
    console.error("Error in summary report:", error);
    return NextResponse.json(
      { error: "Failed to generate summary report" },
      { status: 500 }
    );
  }
}
