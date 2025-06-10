"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { OnScreenKeyboard } from "./on-screen-keyboard";
import { useCustomers } from "@/context/customer-context";
import { toast } from "sonner";

interface AddCustomerFormProps {
  onSuccess: (customer: { id: string; name: string }) => void;
  onCancel: () => void;
}

export function AddCustomerForm({ onSuccess, onCancel }: AddCustomerFormProps) {
  const { addCustomer } = useCustomers();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [activeField, setActiveField] = useState<
    "firstName" | "lastName" | "mobile" | "email" | null
  >(null);

  const handleKeyPress = (key: string) => {
    if (!activeField) return;

    const updateField = (
      field: string,
      setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
      if (key === "backspace") {
        setter(field.slice(0, -1));
      } else if (key === "space") {
        setter(field + " ");
      } else if (key === "clear") {
        setter("");
      } else {
        setter(field + key);
      }
    };

    switch (activeField) {
      case "firstName":
        updateField(firstName, setFirstName);
        break;
      case "lastName":
        updateField(lastName, setLastName);
        break;
      case "mobile":
        // Only allow numbers and spaces for mobile
        if (
          key === "backspace" ||
          key === "clear" ||
          key === "space" ||
          /^[0-9]$/.test(key)
        ) {
          updateField(mobile, setMobile);
        }
        break;
      case "email":
        updateField(email, setEmail);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    if (!mobile.trim()) {
      toast.error("Mobile number is required");
      return;
    }

    // Create full name
    const fullName = `${firstName} ${lastName}`.trim();

    // Add customer (now async, returns full object)
    const newCustomer = await addCustomer({
      name: fullName,
      phone: mobile,
      email: email,
      active: true,
    });

    if (newCustomer && newCustomer.id && newCustomer.name) {
      toast.success(`Customer ${fullName} added successfully`);
      onSuccess(newCustomer);
    } else {
      toast.error("Failed to add customer");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-[30rem]  flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Add New Customer</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-7 w-7"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={() => setActiveField("firstName")}
                className="border-pink-200 h-9"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={() => setActiveField("lastName")}
                className="border-pink-200 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobile" className="text-sm">
              Mobile Number *
            </Label>
            <Input
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onFocus={() => setActiveField("mobile")}
              className="border-pink-200 h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setActiveField("email")}
              className="border-pink-200 h-9"
            />
          </div>
        </div>

        {activeField && (
          <div className="mt-3 border-t pt-3">
            <OnScreenKeyboard onKeyPress={handleKeyPress} />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            type="submit"
            className="flex-1 bg-pink-600 hover:bg-pink-700 h-9"
          >
            Add Customer
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-9"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
