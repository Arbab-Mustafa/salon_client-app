import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
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
    await clientPromise;

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
    }).lean();

    // Debug logging
    console.log("/api/reports/summary", {
      startDate,
      endDate,
      start,
      end,
      transactionCount: transactions.length,
    });

    // Sum all items in all transactions
    let total = 0;
    transactions.forEach((tx) => {
      if (Array.isArray(tx.items)) {
        tx.items.forEach((item) => {
          total += item.price * item.quantity - (item.discount || 0);
        });
      }
    });

    return NextResponse.json({ total });
  } catch (error: any) {
    console.error("/api/reports/summary error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
