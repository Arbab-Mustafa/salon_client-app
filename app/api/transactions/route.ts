import { NextResponse } from "next/server";
import { addTransaction } from "@/data/reports-data";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Validate required fields for new structure
    if (
      !data.customer ||
      !data.therapist ||
      !data.owner ||
      !Array.isArray(data.items) ||
      data.items.length === 0 ||
      typeof data.subtotal !== "number" ||
      typeof data.discount !== "number" ||
      typeof data.total !== "number" ||
      !data.paymentMethod
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }
    const newTransaction = await addTransaction(data);
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    console.error("Transaction POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add transaction" },
      { status: 500 }
    );
  }
}
