import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Settings =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({});
    return NextResponse.json(settings || { logo: "" });
  } catch (error) {
    console.error("Failed to fetch logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ logo: data.logo });
    } else {
      settings.logo = data.logo;
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update logo:", error);
    return NextResponse.json(
      { error: "Failed to update logo" },
      { status: 500 }
    );
  }
}
