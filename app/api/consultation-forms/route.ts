import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

const consultationFormSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
)

const ConsultationForm = mongoose.models.ConsultationForm || mongoose.model("ConsultationForm", consultationFormSchema)

export async function GET() {
  try {
    console.log("Connecting to MongoDB...")
    await connectToDatabase()
    
    console.log("Fetching consultation forms...")
    const forms = await ConsultationForm.find().sort({ createdAt: -1 })
    console.log(`Found ${forms.length} consultation forms`)
    
    return NextResponse.json(forms)
  } catch (error: any) {
    console.error("Error fetching consultation forms:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch consultation forms" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("Connecting to MongoDB...")
    await connectToDatabase()
    
    const data = await request.json()
    console.log("Creating new consultation form with data:", data)
    
    const form = await ConsultationForm.create(data)
    console.log("Consultation form created successfully:", form)
    
    return NextResponse.json(form, { status: 201 })
  } catch (error: any) {
    console.error("Error creating consultation form:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create consultation form" },
      { status: 500 }
    )
  }
} 