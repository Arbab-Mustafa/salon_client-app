// context/service-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceContextType {
  services: Service[];
  addService: (
    service: Omit<Service, "_id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  getActiveServicesByCategory: (category: string) => Array<{ id: string; name: string; price: number; category: string }>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch services from the API
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/services");
        if (!response.ok) throw new Error("Failed to fetch services");
        const data = await response.json();
        setServices(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadServices();
  }, []);

  // All mutations go through the API
  const addService = async (
    serviceData: Omit<Service, "_id" | "createdAt" | "updatedAt">
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error("Failed to add service");
      const newService = await response.json();
      setServices((prev) => [...prev, newService]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    setIsLoading(true);
    console.log(
      "[updateService] Sending PUT to /api/services/" + id,
      serviceData
    );
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
      console.log("[updateService] Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[updateService] Error:", errorData);
        throw new Error(
          "Failed to update service: " + (errorData.error || response.status)
        );
      }
      const updatedService = await response.json();
      console.log("[updateService] Updated service:", updatedService);
      setServices((prev) =>
        prev.map((s) => (s._id === id ? updatedService : s))
      );
    } catch (err: any) {
      setError(err.message);
      console.error("[updateService] Exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    setIsLoading(true);
    console.log("[deleteService] Sending DELETE to /api/services/" + id);
    try {
      const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
      console.log("[deleteService] Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[deleteService] Error:", errorData);
        throw new Error(
          "Failed to delete service: " + (errorData.error || response.status)
        );
      }
      setServices((prev) => prev.filter((s) => s._id !== id));
      console.log("[deleteService] Deleted service with id:", id);
    } catch (err: any) {
      setError(err.message);
      console.error("[deleteService] Exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get active services by category
  const getActiveServicesByCategory = (category: string) => {
    return services
      .filter((service) => service.active && service.category === category)
      .map((service) => ({
        id: service._id,
        name: service.name,
        price: service.price,
        category: service.category,
      }));
  };

  return (
    <ServiceContext.Provider
      value={{
        services,
        addService,
        updateService,
        deleteService,
        isLoading,
        error,
        getActiveServicesByCategory,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (!context)
    throw new Error("useServices must be used within a ServiceProvider");
  return context;
}
