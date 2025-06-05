import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connection";
import {
  userOperations,
  customerOperations,
  serviceOperations,
  transactionOperations,
  consultationFormOperations,
  therapistHoursOperations,
  settingsOperations,
  customOperations,
} from "@/lib/mongodb/db-operations";

// Connect to MongoDB
const db = await connectDB();

export async function POST(req: NextRequest) {
  try {
    const { operation, model, data, query, options } = await req.json();

    let result;

    switch (model) {
      case "user":
        result = await handleUserOperation(operation, data, query, options);
        break;
      case "customer":
        result = await handleCustomerOperation(operation, data, query, options);
        break;
      case "service":
        result = await handleServiceOperation(operation, data, query, options);
        break;
      case "transaction":
        result = await handleTransactionOperation(
          operation,
          data,
          query,
          options
        );
        break;
      case "consultationForm":
        result = await handleConsultationFormOperation(
          operation,
          data,
          query,
          options
        );
        break;
      case "therapistHours":
        result = await handleTherapistHoursOperation(
          operation,
          data,
          query,
          options
        );
        break;
      case "settings":
        result = await handleSettingsOperation(operation, data, query, options);
        break;
      default:
        return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("MongoDB API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Operation handlers
async function handleUserOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await userOperations.create(data);
    case "findById":
      return await userOperations.findById(data.id);
    case "findOne":
      return await userOperations.findOne(query);
    case "find":
      return await userOperations.find(query, options);
    case "update":
      return await userOperations.update(data.id, data);
    case "delete":
      return await userOperations.delete(data.id);
    case "findByUsername":
      return await customOperations.findUserByUsername(data.username);
    case "findActiveTherapists":
      return await customOperations.findActiveTherapists();
    default:
      throw new Error("Invalid operation");
  }
}

async function handleCustomerOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await customerOperations.create(data);
    case "findById":
      return await customerOperations.findById(data.id);
    case "findOne":
      return await customerOperations.findOne(query);
    case "find":
      return await customerOperations.find(query, options);
    case "update":
      return await customerOperations.update(data.id, data);
    case "delete":
      return await customerOperations.delete(data.id);
    case "findByMobile":
      return await customOperations.findCustomerByMobile(data.mobile);
    case "findActive":
      return await customOperations.findActiveCustomers();
    default:
      throw new Error("Invalid operation");
  }
}

async function handleServiceOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await serviceOperations.create(data);
    case "findById":
      return await serviceOperations.findById(data.id);
    case "findOne":
      return await serviceOperations.findOne(query);
    case "find":
      return await serviceOperations.find(query, options);
    case "update":
      return await serviceOperations.update(data.id, data);
    case "delete":
      return await serviceOperations.delete(data.id);
    case "findActive":
      return await customOperations.findActiveServices();
    case "findByCategory":
      return await customOperations.findServicesByCategory(data.categoryId);
    default:
      throw new Error("Invalid operation");
  }
}

async function handleTransactionOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await transactionOperations.create(data);
    case "findById":
      return await transactionOperations.findById(data.id);
    case "findOne":
      return await transactionOperations.findOne(query);
    case "find":
      return await transactionOperations.find(query, options);
    case "update":
      return await transactionOperations.update(data.id, data);
    case "delete":
      return await transactionOperations.delete(data.id);
    case "findByDateRange":
      return await customOperations.getTransactionsByDateRange(
        data.startDate,
        data.endDate
      );
    case "findTherapistTransactions":
      return await customOperations.getTherapistTransactions(
        data.therapistId,
        data.startDate,
        data.endDate
      );
    default:
      throw new Error("Invalid operation");
  }
}

async function handleConsultationFormOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await consultationFormOperations.create(data);
    case "findById":
      return await consultationFormOperations.findById(data.id);
    case "findOne":
      return await consultationFormOperations.findOne(query);
    case "find":
      return await consultationFormOperations.find(query, options);
    case "update":
      return await consultationFormOperations.update(data.id, data);
    case "delete":
      return await consultationFormOperations.delete(data.id);
    case "findCustomerForms":
      return await customOperations.getCustomerConsultationForms(
        data.customerId
      );
    default:
      throw new Error("Invalid operation");
  }
}

async function handleTherapistHoursOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await therapistHoursOperations.create(data);
    case "findById":
      return await therapistHoursOperations.findById(data.id);
    case "findOne":
      return await therapistHoursOperations.findOne(query);
    case "find":
      return await therapistHoursOperations.find(query, options);
    case "update":
      return await therapistHoursOperations.update(data.id, data);
    case "delete":
      return await therapistHoursOperations.delete(data.id);
    case "findByDateRange":
      return await customOperations.getTherapistHoursByDateRange(
        data.therapistId,
        data.startDate,
        data.endDate
      );
    default:
      throw new Error("Invalid operation");
  }
}

async function handleSettingsOperation(
  operation: string,
  data: any,
  query: any,
  options: any
) {
  switch (operation) {
    case "create":
      return await settingsOperations.create(data);
    case "findById":
      return await settingsOperations.findById(data.id);
    case "findOne":
      return await settingsOperations.findOne(query);
    case "find":
      return await settingsOperations.find(query, options);
    case "update":
      return await settingsOperations.update(data.id, data);
    case "delete":
      return await settingsOperations.delete(data.id);
    case "getSetting":
      return await customOperations.getSetting(data.key);
    case "updateSetting":
      return await customOperations.updateSetting(data.key, data.value);
    default:
      throw new Error("Invalid operation");
  }
}
