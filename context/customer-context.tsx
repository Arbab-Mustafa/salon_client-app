"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Customer, ConsultationForm } from "@/types/customer";

interface CustomerContextType {
  customers: Customer[];
  consultationForms: ConsultationForm[];
  addCustomer: (customer: Partial<Customer>) => Promise<Customer | null>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addConsultationForm: (form: Omit<ConsultationForm, "id">) => Promise<void>;
  updateConsultationForm: (
    id: string,
    form: Partial<ConsultationForm>
  ) => Promise<void>;
  deleteConsultationForm: (id: string) => Promise<void>;
  updateLastVisit: (id: string, lastVisit?: Date) => Promise<void>;
  updateLastConsultationFormDate: (id: string, date?: Date) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [consultationForms, setConsultationForms] = useState<
    ConsultationForm[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to map _id to id
  const mapCustomer = (c: any): Customer => {
    const mapped = {
      ...c,
      id: c._id || c.id,
      phone: c.phone || c.mobile || "",
      mobile: c.mobile || c.phone || "",
      active: c.active !== undefined ? c.active : true,
      lastConsultationFormDate:
        c.lastConsultationFormDate || c.lastConsentFormDate || null,
    };
     
    return mapped;
  };
  const mapForm = (f: any): ConsultationForm => ({ ...f, id: f._id || f.id });

  // Load data from MongoDB on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [customersResponse, formsResponse] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/consultation-forms"),
        ]);

        if (!customersResponse.ok || !formsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [customersData, formsData] = await Promise.all([
          customersResponse.json(),
          formsResponse.json(),
        ]);

        setCustomers(customersData.map(mapCustomer));
        setConsultationForms(formsData.map(mapForm));
      } catch (error) {
        
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addCustomer = async (customer: Partial<Customer>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Always send both 'phone' and 'mobile' to backend
      const payload = { ...customer };
      if (!payload.phone && payload.mobile) payload.phone = payload.mobile;
      if (!payload.mobile && payload.phone) payload.mobile = payload.phone;
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add customer");
      const newCustomer = await response.json();
      setCustomers((prev) => [...prev, mapCustomer(newCustomer)]);
      return mapCustomer(newCustomer);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Always send both 'phone' and 'mobile' to backend
      const payload = { ...customer };
      if (!payload.phone && payload.mobile) payload.phone = payload.mobile;
      if (!payload.mobile && payload.phone) payload.mobile = payload.phone;
      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update customer");
      const updatedCustomer = await response.json();
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? mapCustomer(updatedCustomer) : c))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addConsultationForm = async (form: Omit<ConsultationForm, "id">) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/consultation-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error("Failed to add consultation form");
      }
      const newForm = await response.json();
      setConsultationForms((prev) => [...prev, mapForm(newForm)]);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsultationForm = async (
    id: string,
    form: Partial<ConsultationForm>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/consultation-forms/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error("Failed to update consultation form");
      }
      const updatedForm = await response.json();
      setConsultationForms((prev) =>
        prev.map((f) => (f.id === id ? mapForm(updatedForm) : f))
      );
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConsultationForm = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/consultation-forms/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete consultation form");
      }
      setConsultationForms((prev) => prev.filter((f) => f.id !== id));
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastVisit = async (id: string, lastVisit?: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastVisit: lastVisit || new Date() }),
      });
      if (!response.ok) throw new Error("Failed to update last visit");
      const updatedCustomer = await response.json();
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? mapCustomer(updatedCustomer) : c))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastConsultationFormDate = async (id: string, date?: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      

      // Ensure we have a valid date
      const dateToSend = date ? new Date(date) : new Date();
      if (isNaN(dateToSend.getTime())) {
        throw new Error("Invalid date provided");
      }

      // First check if the customer exists and get current data
      const checkResponse = await fetch(`/api/customers/${id}`);
      if (!checkResponse.ok) {
        throw new Error("Customer not found");
      }
      const currentCustomer = await checkResponse.json();
     

      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastConsultationFormDate: dateToSend.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
       
        throw new Error(
          errorData.error || "Failed to update last consultation form date"
        );
      }

      const updatedCustomer = await response.json();
      console.log("Successfully updated customer:", updatedCustomer);

      // Verify the update
      if (!updatedCustomer.lastConsultationFormDate) {
        console.warn(
          "Warning: lastConsultationFormDate not set in response:",
          updatedCustomer
        );
      }

      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? mapCustomer(updatedCustomer) : c))
      );
    } catch (err: any) {
       
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        consultationForms,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateLastVisit,
        addConsultationForm,
        updateConsultationForm,
        deleteConsultationForm,
        updateLastConsultationFormDate,
        isLoading,
        error,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomers must be used within a CustomerProvider");
  }
  return context;
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
}
