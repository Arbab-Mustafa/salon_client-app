import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import type { TransactionData } from "@/data/reports-data";
import type { Model } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate, therapistId, customerId, category } =
      await req.json();

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

    // Build query
    const query: any = {
      date: { $gte: start, $lte: end },
    };

    // Add filters if provided
    if (therapistId && therapistId !== "all") {
      query["therapist.id"] = therapistId;
    }
    if (customerId && customerId !== "all") {
      query["customer.id"] = customerId;
    }
    if (category && category !== "all") {
      query["items.category"] = category;
    }

    const TransactionModel = Transaction as Model<TransactionData>;
    const transactions = await TransactionModel.find(query)
      .sort({ date: -1 })
      .lean();

    // Ensure we always return an array
    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0,
    });
  } catch (error: any) {
    console.error("/api/reports/transactions error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal Server Error",
        transactions: [], // Ensure we return an empty array on error
      },
      { status: 500 }
    );
  }
}
