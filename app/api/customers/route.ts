import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import mongoose from "mongoose";

// GET all customers
export async function GET() {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    await connectToDatabase();
    console.log("Connected to DB:", mongoose.connection.name);

    const customers = await Customer.find().sort({ createdAt: -1 });
    console.log(`Found ${customers.length} customers`);
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST new customer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const customer = await Customer.create({
      name,
      phone,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
