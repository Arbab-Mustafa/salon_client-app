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
import { toast } from "sonner";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export function CustomersList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      setCustomers(data);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error(error.message || "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(error.message || "Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/customers/new")}>
          Add Customer
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  {customer.active !== false ? (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 border border-green-300">Active</span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 border border-red-300">Inactive</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.address?.street && (
                    <div>
                      {customer.address.street}
                      {customer.address.city && `, ${customer.address.city}`}
                      {customer.address.state && `, ${customer.address.state}`}
                      {customer.address.zipCode &&
                        ` ${customer.address.zipCode}`}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/customers/${customer._id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      router.push(`/customers/${customer._id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => handleDelete(customer._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
