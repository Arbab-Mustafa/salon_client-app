import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  services: [
    {
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "no-show"],
    default: "scheduled",
  },
  notes: String,
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "partial"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "transfer", "other"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
appointmentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Calculate total amount before saving
appointmentSchema.pre("save", function (next) {
  if (this.isModified("services")) {
    this.totalAmount = this.services.reduce(
      (total, service) => total + service.price,
      0
    );
  }
  next();
});

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
