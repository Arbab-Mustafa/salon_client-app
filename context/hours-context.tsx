"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { getTransactionsForDateRange } from "@/data/reports-data";
import { TherapistHours } from "@/types/hours";

type HoursContextType = {
  hours: TherapistHours[];
  addHours: (therapistId: string, date: string, hours: number) => void;
  getHoursForTherapist: (
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) => number;
  getHoursForDateRange: (
    startDate: Date,
    endDate: Date
  ) => Array<{
    therapistId: string;
    therapistName: string;
    hours: number;
  }>;
  calculateCommission: (
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) => {
    revenue: number;
    hours: number;
    wage: number;
    holidayPay: number;
    employerNIC: number;
    commission: number;
    salonShare: number;
    therapistShare: number;
  };
  updateHours: (therapistId: string, hours: TherapistHours) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const HoursContext = createContext<HoursContextType | undefined>(undefined);

export function HoursProvider({ children }: { children: ReactNode }) {
  const { user, users } = useAuth();
  const [hours, setHours] = useState<TherapistHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load hours from MongoDB on mount
  useEffect(() => {
    const loadHours = async () => {
      try {
        const response = await fetch("/api/hours");
        if (!response.ok) {
          throw new Error("Failed to fetch hours");
        }
        const data = await response.json();
        setHours(data);
      } catch (error) {
        console.error("Failed to load hours:", error);
        setError("Failed to load hours");
      } finally {
        setIsLoading(false);
      }
    };

    loadHours();
  }, []);

  const addHours = async (
    therapistId: string,
    date: string,
    hoursWorked: number
  ) => {
    try {
      // Validate hours
      if (hoursWorked < 0 || hoursWorked > 24) {
        throw new Error("Hours must be between 0 and 24");
      }

      // Check for existing entry
      const existingEntry = hours.find(
        (entry) => entry.therapistId === therapistId && entry.date === date
      );

      const hoursData = {
        therapistId,
        date,
        hours: hoursWorked,
      };

      // Make API call to save/update hours
      const response = await fetch("/api/hours", {
        method: existingEntry ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hoursData),
      });

      if (!response.ok) {
        throw new Error("Failed to save hours");
      }

      const savedHours = await response.json();

      // Update local state
      setHours((prevHours) => {
        if (existingEntry) {
          return prevHours.map((h) =>
            h.therapistId === therapistId && h.date === date ? savedHours : h
          );
        } else {
          return [...prevHours, savedHours];
        }
      });

      return savedHours;
    } catch (error) {
      console.error("Error saving hours:", error);
      setError(error instanceof Error ? error.message : "Failed to save hours");
      throw error;
    }
  };

  const getHoursForTherapist = (
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) => {
    // Convert dates to string format for comparison
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    return hours
      .filter((entry) => {
        return (
          entry.therapistId === therapistId &&
          entry.date >= start &&
          entry.date <= end
        );
      })
      .reduce((total, entry) => total + entry.hours, 0);
  };

  // New function to get hours for all therapists in a date range
  const getHoursForDateRange = (startDate: Date, endDate: Date) => {
    // Convert dates to string format for comparison
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    // Get all hours entries in the date range
    const hoursInRange = hours.filter(
      (entry) => entry.date >= start && entry.date <= end
    );

    // Group by therapist
    const therapistHoursMap = new Map<string, number>();

    hoursInRange.forEach((entry) => {
      const current = therapistHoursMap.get(entry.therapistId) || 0;
      therapistHoursMap.set(entry.therapistId, current + entry.hours);
    });

    // Convert to array with therapist names
    return Array.from(therapistHoursMap.entries()).map(
      ([therapistId, hours]) => {
        // Find therapist name from users array
        const therapist = users.find((u) => u.id === therapistId);
        return {
          therapistId,
          therapistName: therapist?.name || "Unknown",
          hours,
        };
      }
    );
  };

  const calculateCommission = (
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) => {
    // Get all transactions for this therapist in the date range
    const transactions = getTransactionsForDateRange(
      startDate,
      endDate,
      therapistId
    );

    // Calculate total revenue
    const revenue = transactions.reduce(
      (sum, t) => sum + (t.amount - t.discount),
      0
    );

    // Get the therapist's details
    const therapist = users.find((u) => u.id === therapistId) || {
      id: therapistId,
      name: "Unknown",
      role: "therapist" as const,
      employmentType: "employed" as const,
      hourlyRate: 0,
    };

    // Get total hours worked
    const hoursWorked = getHoursForTherapist(therapistId, startDate, endDate);

    // Initialize result object
    const result = {
      revenue,
      hours: hoursWorked,
      wage: 0,
      holidayPay: 0,
      employerNIC: 0,
      commission: 0,
      salonShare: 0,
      therapistShare: 0,
    };

    // Calculate based on employment type
    if (therapist.employmentType === "employed") {
      // For employed therapists: wage + holiday pay + NIC, then 10% commission
      const hourlyRate = therapist.hourlyRate || 0;
      const wage = hoursWorked * hourlyRate;
      const holidayPay = wage * 0.12; // 12% holiday pay
      const employerNIC = wage * 0.138; // 13.8% employer NIC

      result.wage = wage;
      result.holidayPay = holidayPay;
      result.employerNIC = employerNIC;

      // Commission is 10% of revenue after deducting costs
      const costs = wage + holidayPay + employerNIC;
      result.commission = Math.max(0, (revenue - costs) * 0.1);

      result.therapistShare = wage + holidayPay + result.commission;
      result.salonShare = revenue - result.therapistShare;
    } else {
      // For self-employed therapists: 40% of revenue
      result.therapistShare = revenue * 0.4;
      result.salonShare = revenue * 0.6;
    }

    return result;
  };

  const updateHours = async (therapistId: string, newHours: TherapistHours) => {
    try {
      const response = await fetch(`/api/hours/${therapistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newHours),
      });

      if (!response.ok) {
        throw new Error("Failed to update hours");
      }

      const updatedHours = await response.json();
      setHours((prev) =>
        prev.map((h) => (h.therapistId === therapistId ? updatedHours : h))
      );
    } catch (error) {
      console.error("Failed to update hours:", error);
      setError("Failed to update hours");
      throw error;
    }
  };

  return (
    <HoursContext.Provider
      value={{
        hours,
        addHours,
        getHoursForTherapist,
        getHoursForDateRange,
        calculateCommission,
        updateHours,
        isLoading,
        error,
      }}
    >
      {children}
    </HoursContext.Provider>
  );
}

export function useHours() {
  const context = useContext(HoursContext);
  if (context === undefined) {
    throw new Error("useHours must be used within a HoursProvider");
  }
  return context;
}

export const addHoursEntry = () => {};
