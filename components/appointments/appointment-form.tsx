"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: number;
}

interface AppointmentFormProps {
  initialData?: {
    _id?: string;
    customer: string;
    services: string[];
    startTime: string;
    endTime: string;
    status: "scheduled" | "completed" | "cancelled";
    notes: string;
    totalAmount: number;
    paymentStatus: "pending" | "paid";
    paymentMethod: "cash" | "card" | "other";
  };
}

export function AppointmentForm({ initialData }: AppointmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    customer: initialData?.customer || "",
    services: initialData?.services || [],
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    status: initialData?.status || "scheduled",
    notes: initialData?.notes || "",
    totalAmount: initialData?.totalAmount || 0,
    paymentStatus: initialData?.paymentStatus || "pending",
    paymentMethod: initialData?.paymentMethod || "cash",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, servicesRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/services"),
        ]);

        const [customersData, servicesData] = await Promise.all([
          customersRes.json(),
          servicesRes.json(),
        ]);

        if (!customersRes.ok || !servicesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        setCustomers(customersData);
        setServices(servicesData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = initialData?._id
        ? `/api/appointments/${initialData._id}`
        : "/api/appointments";

      const method = initialData?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save appointment");
      }

      toast.success(
        initialData?._id
          ? "Appointment updated successfully"
          : "Appointment created successfully"
      );
      router.push("/appointments");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      toast.error(
        error.message || "An error occurred while saving the appointment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData((prev) => {
      const services = prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId];

      const selectedServices = services
        .map((id) => services.find((s) => s._id === id))
        .filter(Boolean) as Service[];

      const totalAmount = selectedServices.reduce(
        (sum, service) => sum + service.price,
        0
      );

      return {
        ...prev,
        services,
        totalAmount,
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="customer">Customer</Label>
          <Select
            value={formData.customer}
            onValueChange={(value) => handleSelectChange("customer", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer._id} value={customer._id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Services</Label>
          <div className="grid gap-2">
            {services.map((service) => (
              <div key={service._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={service._id}
                  checked={formData.services.includes(service._id)}
                  onChange={() => handleServiceChange(service._id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={service._id} className="text-sm">
                  {service.name} - ${service.price} ({service.duration} min)
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              name="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select
              value={formData.paymentStatus}
              onValueChange={(value) =>
                handleSelectChange("paymentStatus", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                handleSelectChange("paymentMethod", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input
            id="totalAmount"
            name="totalAmount"
            type="number"
            value={formData.totalAmount}
            readOnly
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData?._id ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
