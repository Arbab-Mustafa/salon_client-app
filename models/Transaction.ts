import mongoose, { Model } from "mongoose";
import type { TransactionData } from "@/data/reports-data";

const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },
    customer: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      phone: { type: String },
      email: { type: String },
    },
    therapist: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String },
    },
    owner: {
      id: { type: String },
      name: { type: String },
      role: { type: String },
    },
    items: [
      {
        name: { type: String, required: true },
        category: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        discount: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["cash", "card", "other"],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
transactionSchema.index({ date: 1 });
transactionSchema.index({ "customer.id": 1 });
transactionSchema.index({ "therapist.id": 1 });
transactionSchema.index({ "items.category": 1 });

let Transaction: Model<TransactionData>;
try {
  Transaction =
    (mongoose.models.Transaction as Model<TransactionData>) ||
    mongoose.model<TransactionData>("Transaction", transactionSchema);
} catch (error) {
  console.error("Error defining Transaction model:", error);
  // Fallback: try to use the already defined model
  Transaction = mongoose.models.Transaction as Model<TransactionData>;
}

export default Transaction;
