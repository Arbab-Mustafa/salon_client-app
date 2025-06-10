import mongoose from "mongoose";

const consultationFormSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Therapist reference is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required"],
    },
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: [true, "Form answers are required"],
    },
    completedAt: {
      type: Date,
      required: [true, "Completion date is required"],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["draft", "completed", "archived"],
      default: "completed",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
consultationFormSchema.index({ customer: 1 });
consultationFormSchema.index({ therapist: 1 });
consultationFormSchema.index({ owner: 1 });
consultationFormSchema.index({ completedAt: 1 });
consultationFormSchema.index({ status: 1 });

// Update the customer's lastConsultationFormDate when a form is completed
consultationFormSchema.post("save", async function (doc) {
  if (doc.status === "completed") {
    try {
      const Customer = mongoose.model("Customer");
      await Customer.findByIdAndUpdate(doc.customer, {
        lastConsultationFormDate: doc.completedAt,
      });
    } catch (error) {
      console.error(
        "Error updating customer's lastConsultationFormDate:",
        error
      );
    }
  }
});

const ConsultationForm =
  mongoose.models.ConsultationForm ||
  mongoose.model("ConsultationForm", consultationFormSchema);

export default ConsultationForm;
