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
    await clientPromise;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const TransactionModel = Transaction as Model<TransactionData>;
    const transactions: TransactionData[] = await TransactionModel.find({
      date: { $gte: start, $lte: end },
    })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("/api/reports/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
