import { NextResponse } from "next/server";
import { Service } from "@/models/service";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("Mongoose connection name:", mongoose.connection.name);

// GET all services
export async function GET() {
  try {
    console.log("Connecting to MongoDB...");
    await connectToDatabase();
    console.log("Fetching all services...");
    const services = await Service.find({}).sort({ createdAt: -1 });
    console.log(`Found ${services.length} services`);
    return NextResponse.json(services);
  } catch (error: any) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST new service
export async function POST(request: Request) {
  try {
    console.log("Connecting to MongoDB...");
    await connectToDatabase();
    const data = await request.json();
    console.log("Creating new service with data:", data);
    const service = await Service.create(data);
    console.log("Service created in DB:", service);
    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create service" },
      { status: 500 }
    );
  }
}
