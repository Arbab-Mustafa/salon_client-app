import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/models/Appointment";

// GET all appointments
export async function GET() {
  try {
    await connectDB();
    const appointments = await Appointment.find()
      .populate("customer")
      .populate("services")
      .sort({ startTime: -1 });
    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST new appointment
export async function POST(req: Request) {
  try {
    const data = await req.json();
    await connectDB();

    const appointment = await Appointment.create(data);
    await appointment.populate(["customer", "services"]);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
