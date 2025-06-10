import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import ConsultationForm from "@/models/ConsultationForm";
import { getServerSession } from "next-auth";
import Customer from "@/models/Customer";
import User from "@/models/User";

// GET all consultation forms
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const forms = await ConsultationForm.find()
      .populate("customer", "name email phone")
      .populate("therapist", "name email role")
      .populate("owner", "name email role")
      .sort({ completedAt: -1 });

    return NextResponse.json(forms);
  } catch (error: any) {
    console.error("Error fetching consultation forms:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST new consultation form
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("Received consultation form data:", data);

    await connectToDatabase();

    // Validate required fields
    if (!data.customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Get the current user (therapist) and owner
    const [therapist, owner] = await Promise.all([
      User.findOne({ email: session.user?.email }),
      User.findOne({ role: "owner" }),
    ]);

    if (!therapist) {
      return NextResponse.json(
        { error: "Therapist not found" },
        { status: 404 }
      );
    }

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    // Create the consultation form
    const form = new ConsultationForm({
      customer: new mongoose.Types.ObjectId(data.customerId),
      therapist: therapist._id,
      owner: owner._id,
      answers: data.answers || {},
      completedAt: data.completedAt || new Date(),
      status: "completed",
      notes: data.notes,
    });

    await form.save();
    console.log("Saved consultation form:", form);

    // The customer's lastConsultationFormDate will be updated automatically
    // by the post-save hook in the ConsultationForm model

    return NextResponse.json(form);
  } catch (error: any) {
    console.error("Error creating consultation form:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
