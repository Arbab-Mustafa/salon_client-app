import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import mongoose from "mongoose";

// GET all users
export async function GET() {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    await connectToDatabase();
    console.log("Connected to DB:", mongoose.connection.name);

    // First try to find the specific user we're looking for
    const testUser = await User.findOne({ username: "testuser" });
    console.log("Test user exists?", testUser ? "Yes" : "No");
    if (testUser) {
      console.log("Test user details:", {
        id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
      });
    }

    // Get all users
    const users = await User.find().sort({ createdAt: -1 }).select("-password");

    console.log(
      "All users in database:",
      JSON.stringify(
        users.map((u) => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
        null,
        2
      )
    );
    console.log(`Found ${users.length} users`);

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST new user
export async function POST(request: Request) {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    await connectToDatabase();

    const data = await request.json();
    console.log("Raw data received:", data);

    // Validate required fields
    const requiredFields = ["username", "email", "password", "name"];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Normalize the data
    const userData = {
      username: data.username.toLowerCase().trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password,
      name: data.name.trim(),
      role: data.role || "user",
      active: data.active !== undefined ? Boolean(data.active) : true,
      employmentType: data.employmentType,
      hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
    };

    console.log("Normalized user data:", {
      ...userData,
      password: "[REDACTED]",
    });

    // Check for existing user
    const existing = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existing) {
      console.log("User already exists with:", {
        email: existing.email,
        username: existing.username,
        id: existing._id,
      });
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Create new user
    console.log("Creating new user...");
    const user = new User(userData);

    // Validate the user before saving
    const validationError = user.validateSync();
    if (validationError) {
      console.log("Validation error:", validationError);
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Save the user
    await user.save();
    console.log("User saved successfully:", {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Verify the user was created
    const verifyUser = await User.findById(user._id);
    console.log("Verification - User exists in DB:", verifyUser ? "Yes" : "No");
    if (verifyUser) {
      console.log("Verification - User details:", {
        id: verifyUser._id,
        username: verifyUser.username,
        email: verifyUser.email,
        role: verifyUser.role,
      });
    }

    // Return the user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    const { id, ...update } = data;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Ensure active state is properly handled
    if ('active' in update) {
      update.active = Boolean(update.active);
    }

    // Add updatedAt timestamp
    update.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      id,
      { $set: update },
      {
      new: true,
      runValidators: true,
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObj = user.toObject();
    delete userObj.password;
    return NextResponse.json(userObj);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
