import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customer,
      therapist,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!customer?.id || !customer?.name) {
      return NextResponse.json(
        { error: "Customer information is required" },
        { status: 400 }
      );
    }

    if (!therapist?.id || !therapist?.name) {
      return NextResponse.json(
        { error: "Therapist information is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (
      !paymentMethod ||
      !["cash", "card", "other"].includes(paymentMethod.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Valid payment method is required" },
        { status: 400 }
      );
    }

    // Validate amounts
    if (typeof subtotal !== "number" || subtotal <= 0) {
      return NextResponse.json(
        { error: "Valid subtotal is required" },
        { status: 400 }
      );
    }

    if (typeof discount !== "number" || discount < 0) {
      return NextResponse.json(
        { error: "Valid discount amount is required" },
        { status: 400 }
      );
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json(
        { error: "Valid total amount is required" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.name || typeof item.price !== "number" || item.price <= 0) {
        return NextResponse.json(
          { error: "Each item must have a name and valid price" },
          { status: 400 }
        );
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Each item must have a valid quantity" },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const transaction = await Transaction.create({
      date: new Date(),
      customer,
      therapist,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: paymentMethod.toLowerCase(),
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const transactions = await Transaction.find({})
      .sort({ date: -1 })
      .limit(100);
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
