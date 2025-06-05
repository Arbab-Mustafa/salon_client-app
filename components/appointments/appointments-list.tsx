"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Appointment {
  _id: string;
  customer: Customer;
  services: Service[];
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
  totalAmount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "cash" | "card" | "other";
  createdAt: string;
  updatedAt: string;
}

export function AppointmentsList() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchAppointments = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      if (dateFilter) {
        queryParams.append("date", dateFilter);
      }

      const response = await fetch(
        `/api/appointments?${queryParams.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch appointments");
      }

      setAppointments(data);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error(
        error.message || "An error occurred while fetching appointments"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete appointment");
      }

      toast.success("Appointment deleted successfully");
      fetchAppointments();
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      toast.error(
        error.message || "An error occurred while deleting the appointment"
      );
    }
  };

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.customer.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.services.some((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      appointment.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <Button onClick={() => router.push("/appointments/new")}>
          Add Appointment
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.map((appointment) => (
              <TableRow key={appointment._id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {appointment.customer.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.customer.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {appointment.services.map((service) => (
                      <div key={service._id} className="text-sm">
                        {service.name}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {new Date(appointment.startTime).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(appointment.startTime).toLocaleTimeString()} -{" "}
                      {new Date(appointment.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : appointment.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      ${appointment.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.paymentStatus} ({appointment.paymentMethod})
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/appointments/${appointment._id}`)
                      }
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/appointments/${appointment._id}/edit`)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(appointment._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
