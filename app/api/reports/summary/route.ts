import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import type { TransactionData } from "@/data/reports-data";
import type { Model } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate } = await req.json();
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing startDate or endDate" },
        { status: 400 }
      );
    }
    // Ensure DB connection (for Mongoose, this is usually handled globally)
    await connectToDatabase();

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Explicitly type Transaction as a Model<TransactionData>
    const TransactionModel = Transaction as Model<TransactionData>;
    const transactions: TransactionData[] = await TransactionModel.find({
      date: { $gte: start, $lte: end },
    })
      .sort({ date: -1 })
      .lean();

    // Debug logging
    console.log("/api/reports/summary", {
      startDate,
      endDate,
      start,
      end,
      transactionCount: transactions.length,
    });

    // Calculate total revenue using transaction-level totals (after discounts)
    let total = 0;
    let subtotal = 0;
    let totalDiscount = 0;

    transactions.forEach((tx) => {
      // Use transaction total (which is subtotal - discount)
      total += tx.total || 0;
      subtotal += tx.subtotal || 0;
      totalDiscount += tx.discount || 0;
    });

    return NextResponse.json({
      transactions, // Return the full transaction data
      summary: {
        total: Math.round(total * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error in /api/reports/summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
