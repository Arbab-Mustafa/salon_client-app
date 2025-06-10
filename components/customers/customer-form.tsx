"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";
import { toast } from "sonner";

interface CustomerFormProps {
  initialData?: {
    _id?: string;
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
    active?: boolean;
  };
}

export function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<
    | "name"
    | "email"
    | "phone"
    | "address.street"
    | "address.city"
    | "address.state"
    | "address.zipCode"
    | "notes"
    | null
  >(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: {
      street: initialData?.address?.street || "",
      city: initialData?.address?.city || "",
      state: initialData?.address?.state || "",
      zipCode: initialData?.address?.zipCode || "",
    },
    notes: initialData?.notes || "",
    active: initialData?.active !== undefined ? initialData.active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = initialData?._id
        ? `/api/customers/${initialData._id}`
        : "/api/customers";

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
        throw new Error(data.error || "Failed to save customer");
      }

      toast.success(
        initialData?._id
          ? "Customer updated successfully"
          : "Customer created successfully"
      );
      router.push("/customers");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast.error(
        error.message || "An error occurred while saving the customer"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (!activeField) return;

    const updateField = (field: string, setter: (value: string) => void) => {
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

    if (activeField.startsWith("address.")) {
      const field = activeField.split(".")[1];
      const currentValue =
        formData.address[field as keyof typeof formData.address];
      updateField(currentValue, (newValue) => {
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            [field]: newValue,
          },
        }));
      });
    } else {
      const currentValue = formData[activeField as keyof typeof formData];
      if (typeof currentValue === "string") {
        updateField(currentValue, (newValue) => {
          setFormData((prev) => ({
            ...prev,
            [activeField]: newValue,
          }));
        });
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setActiveField("name")}
              required
              className="border-pink-200"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setActiveField("email")}
            required
            className="border-pink-200"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onFocus={() => setActiveField("phone")}
            required
            className="border-pink-200"
          />
        </div>
        <div className="grid gap-2">
          <Label>Address</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="address.street"
              placeholder="Street"
              value={formData.address.street}
              onChange={handleChange}
              onFocus={() => setActiveField("address.street")}
              className="border-pink-200"
            />
            <Input
              name="address.city"
              placeholder="City"
              value={formData.address.city}
              onChange={handleChange}
              onFocus={() => setActiveField("address.city")}
              className="border-pink-200"
            />
            <Input
              name="address.state"
              placeholder="State"
              value={formData.address.state}
              onChange={handleChange}
              onFocus={() => setActiveField("address.state")}
              className="border-pink-200"
            />
            <Input
              name="address.zipCode"
              placeholder="ZIP Code"
              value={formData.address.zipCode}
              onChange={handleChange}
              onFocus={() => setActiveField("address.zipCode")}
              className="border-pink-200"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onFocus={() => setActiveField("notes")}
            rows={4}
            className="border-pink-200"
          />
        </div>
      </div>

      {/* Keyboard Toggle Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={showKeyboard ? "default" : "outline"}
          className="flex-1 border-pink-200"
          onClick={() => setShowKeyboard(!showKeyboard)}
        >
          {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
        </Button>
      </div>

      {/* On-Screen Keyboard */}
      {showKeyboard && (
        <div className="mt-3 border-t pt-3">
          <OnScreenKeyboard onKeyPress={handleKeyPress} />
        </div>
      )}

      {/* Active/Inactive Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          checked={formData.active}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, active: e.target.checked }))
          }
          className="w-5 h-5 accent-pink-600"
          aria-label="Active status"
        />
        <Label htmlFor="active" className="text-lg font-medium">
          {formData.active ? "Active" : "Inactive"}
        </Label>
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
