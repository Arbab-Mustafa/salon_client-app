import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  notes: String,
  active: {
    type: Boolean,
    default: true,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastVisit: {
    type: Date,
    default: null,
  },
  lastConsultationFormDate: {
    type: Date,
    default: null,
  },
});

// Update the updatedAt timestamp before saving
customerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);
