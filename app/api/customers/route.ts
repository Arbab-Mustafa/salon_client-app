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
export async function POST(request: Request) {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    await connectToDatabase();
    const data = await request.json();
    console.log("Creating new customer with data:", data);

    // Ensure 'active' is set, default to true if not provided
    if (typeof data.active !== "boolean") data.active = true;
    // Ensure both 'phone' and 'mobile' are set
    if (!data.phone && data.mobile) data.phone = data.mobile;
    if (!data.mobile && data.phone) data.mobile = data.phone;

    // Always include 'active' in the document
    const customer = await Customer.create({
      ...data,
      active: data.active,
    });
    console.log("Customer created successfully:", customer);

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
