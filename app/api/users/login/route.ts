import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log("Login attempt received:", { username });

    if (!username || !password) {
      console.log("Missing credentials:", { username: !!username, password: !!password });
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    console.log("Database connected successfully");

    // Find user and explicitly select password field
    const user = await User.findOne({ username: username.toLowerCase() }).select("+password");
    console.log("User found:", user ? "Yes" : "No");
    if (user) {
      console.log("Found user:", {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    }

    if (!user) {
      console.log("No user found with username:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    console.log("Comparing passwords...");
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password for user:", username);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    console.log("Login successful for user:", username);

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error("Login error details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
