import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Clear any existing model to prevent conflicts
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  active: boolean;
  employmentType: string;
  hourlyRate: number;
}

// Define schema with strict validation
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return v && v.length > 0;
        },
        message: "Username cannot be empty",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      validate: {
        validator: function (v: string) {
          return v && v.length >= 6;
        },
        message: "Password must be at least 6 characters long",
      },
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      validate: {
        validator: function (v: string) {
          return v && v.length > 0;
        },
        message: "Name cannot be empty",
      },
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "owner", "therapist", "manager"],
        message:
          "Role must be one of 'user', 'admin', 'owner', 'therapist', 'manager'",
      },
      default: "user",
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    employmentType: {
      type: String,
      enum: {
        values: ["employed", "self-employed"],
        message: "Employment type must be either 'employed' or 'self-employed'",
      },
    },
    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Debug middleware for all operations
userSchema.pre("save", async function (next) {
  console.log("Pre-save hook - User data:", {
    username: this.username,
    email: this.email,
    name: this.name,
    role: this.role,
    isModified: this.isModified(),
    isNew: this.isNew,
    modifiedPaths: this.modifiedPaths(),
  });

  if (!this.isModified("password")) {
    console.log("Password not modified, skipping hash");
    return next();
  }

  try {
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully");
    next();
  } catch (error: any) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Debug middleware for find operations
userSchema.pre("find", function () {
  console.log("Executing find operation");
});

userSchema.pre("findOne", function () {
  console.log("Executing findOne operation");
});

// Password comparison method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  console.log("Comparing passwords...");
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw error;
  }
};

// Create and export the model
const User = mongoose.model<IUser>("User", userSchema);

export default User;
