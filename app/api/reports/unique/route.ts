import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET() {
  await clientPromise;
  const therapists = await Transaction.distinct("therapist.name");
  const customers = await Transaction.distinct("customer.name");
  const categories = await Transaction.distinct("items.category");
  return NextResponse.json({ therapists, customers, categories });
} 