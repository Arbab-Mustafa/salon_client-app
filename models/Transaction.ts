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
      id: { type: String, required: [true, "Customer ID is required"] },
      name: { type: String, required: [true, "Customer name is required"] },
      phone: { type: String },
      email: { type: String },
    },
    therapist: {
      id: { type: String, required: [true, "Therapist ID is required"] },
      name: { type: String, required: [true, "Therapist name is required"] },
      role: { type: String },
    },
    owner: {
      id: { type: String },
      name: { type: String },
      role: { type: String },
    },
    items: [
      {
        name: { type: String, required: [true, "Item name is required"] },
        category: { type: String },
        price: {
          type: Number,
          required: [true, "Item price is required"],
          min: [0, "Price cannot be negative"],
        },
        quantity: {
          type: Number,
          required: [true, "Item quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Discount cannot be negative"],
        },
      },
    ],
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["cash", "card", "other"],
        message: "Payment method must be either 'cash', 'card', or 'other'",
      },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "refunded", "cancelled"],
      default: "completed",
    },
    notes: {
      type: String,
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
transactionSchema.index({ status: 1 });

// Add validation to ensure calculations are correct
transactionSchema.pre("save", function (next) {
  // Calculate items total (before any discounts)
  const itemsTotal = this.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Validate subtotal matches items total (before discounts)
  if (Math.abs(itemsTotal - this.subtotal) > 0.01) {
    console.error("Subtotal validation failed:", {
      itemsTotal,
      subtotal: this.subtotal,
      difference: Math.abs(itemsTotal - this.subtotal),
    });
    next(
      new Error(
        `Subtotal does not match items total: ${itemsTotal} vs ${this.subtotal}`
      )
    );
    return;
  }

  // Validate total = subtotal - discount
  const expectedTotal = Math.max(0, this.subtotal - (this.discount || 0));
  if (Math.abs(expectedTotal - this.total) > 0.01) {
    console.error("Total validation failed:", {
      subtotal: this.subtotal,
      discount: this.discount || 0,
      total: this.total,
      expectedTotal,
    });
    next(
      new Error(
        `Total does not match subtotal minus discount: ${expectedTotal} vs ${this.total}`
      )
    );
    return;
  }

  // Ensure discount is not negative
  if (this.discount < 0) {
    next(new Error("Discount cannot be negative"));
    return;
  }

  // Ensure discount doesn't exceed subtotal
  if (this.discount > this.subtotal) {
    next(new Error("Discount cannot exceed subtotal"));
    return;
  }

  next();
});

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;
