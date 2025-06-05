import {
  User,
  Customer,
  Service,
  Transaction,
  ConsultationForm,
  TherapistHours,
  Settings,
} from "./models";
import type { Document } from "mongoose";

// Generic CRUD operations
export class DatabaseOperations<T extends Document> {
  constructor(private model: any) {}

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return await doc.save();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  async findOne(query: any): Promise<T | null> {
    return await this.model.findOne(query);
  }

  async find(query: any = {}, options: any = {}): Promise<T[]> {
    return await this.model.find(query, null, options);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }
}

// Specific operations for each model
export const userOperations = new DatabaseOperations(User);
export const customerOperations = new DatabaseOperations(Customer);
export const serviceOperations = new DatabaseOperations(Service);
export const transactionOperations = new DatabaseOperations(Transaction);
export const consultationFormOperations = new DatabaseOperations(
  ConsultationForm
);
export const therapistHoursOperations = new DatabaseOperations(TherapistHours);
export const settingsOperations = new DatabaseOperations(Settings);

// Custom operations for specific business logic
export const customOperations = {
  // User operations
  async findUserByUsername(username: string) {
    return await User.findOne({ username });
  },

  async findActiveTherapists() {
    return await User.find({ role: "therapist", active: true });
  },

  // Customer operations
  async findCustomerByMobile(mobile: string) {
    return await Customer.findOne({ mobile });
  },

  async findActiveCustomers() {
    return await Customer.find({ active: true });
  },

  // Transaction operations
  async getTransactionsByDateRange(startDate: Date, endDate: Date) {
    return await Transaction.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate("customerId therapistId serviceId");
  },

  async getTherapistTransactions(
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await Transaction.find({
      therapistId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate("customerId serviceId");
  },

  // Service operations
  async findActiveServices() {
    return await Service.find({ active: true }).populate("categoryId");
  },

  async findServicesByCategory(categoryId: string) {
    return await Service.find({ categoryId, active: true });
  },

  // Consultation form operations
  async getCustomerConsultationForms(customerId: string) {
    return await ConsultationForm.find({ customerId }).sort({ updatedAt: -1 });
  },

  // Therapist hours operations
  async getTherapistHoursByDateRange(
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await TherapistHours.find({
      therapistId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  },

  // Settings operations
  async getSetting(key: string) {
    const setting = await Settings.findOne({ key });
    return setting?.value;
  },

  async updateSetting(key: string, value: any) {
    return await Settings.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  },
};
