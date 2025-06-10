import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getServerSession } from "next-auth";

// GET single customer
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const customer = await Customer.findById(params.id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update customer
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await connectToDatabase();

    // Defensive: ensure phone/mobile
    if (!data.phone && data.mobile) data.phone = data.mobile;
    if (!data.mobile && data.phone) data.mobile = data.phone;

    const updateData = { ...data, updatedAt: new Date() };
    if (!("active" in data)) {
      delete updateData.active; // Don't overwrite if not sent
    }

    const customer = await Customer.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const customer = await Customer.findByIdAndDelete(params.id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH lastVisit or lastConsultationFormDate for customer
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();
    console.log("PATCH request data:", data);

    // First get the current customer data
    const currentCustomer = await Customer.findById(params.id);
    if (!currentCustomer) {
      console.error("Customer not found:", params.id);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    console.log("Current customer data:", currentCustomer.toObject());

    const updateData: any = { updatedAt: new Date() };

    if (data.lastVisit !== undefined) {
      try {
        const date = new Date(data.lastVisit);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid lastVisit date format");
        }
        updateData.lastVisit = date;
      } catch (error) {
        console.error("Error parsing lastVisit date:", error);
        return NextResponse.json(
          { error: "Invalid lastVisit date format" },
          { status: 400 }
        );
      }
    }

    if (data.lastConsultationFormDate !== undefined) {
      try {
        const date = new Date(data.lastConsultationFormDate);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid lastConsultationFormDate format");
        }
        updateData.lastConsultationFormDate = date;
        // Also remove the old field if it exists
        updateData.$unset = { lastConsentFormDate: "" };
        console.log("Setting lastConsultationFormDate to:", date);
      } catch (error) {
        console.error("Error parsing lastConsultationFormDate:", error);
        return NextResponse.json(
          { error: "Invalid lastConsultationFormDate format" },
          { status: 400 }
        );
      }
    }

    console.log("Updating customer with data:", updateData);
    const customer = await Customer.findByIdAndUpdate(params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      console.error("Customer not found after update:", params.id);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const updatedCustomer = customer.toObject();
    console.log("Successfully updated customer:", updatedCustomer);

    // Verify the update
    if (
      data.lastConsultationFormDate &&
      !updatedCustomer.lastConsultationFormDate
    ) {
      console.warn(
        "Warning: lastConsultationFormDate not set in updated customer:",
        updatedCustomer
      );
    }

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
