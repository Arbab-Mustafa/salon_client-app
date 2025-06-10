"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ServiceFormProps {
  initialData?: {
    _id?: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    category: "hair" | "beauty" | "nails" | "other";
    isActive: boolean;
  };
}

export function ServiceForm({ initialData }: ServiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<
    "name" | "description" | "price" | "duration" | null
  >(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    duration: initialData?.duration || 30,
    category: initialData?.category || "hair",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = initialData?._id
        ? `/api/services/${initialData._id}`
        : "/api/services";

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
        throw new Error(data.error || "Failed to save service");
      }

      toast.success(
        initialData?._id
          ? "Service updated successfully"
          : "Service created successfully"
      );
      router.push("/services");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast.error(
        error.message || "An error occurred while saving the service"
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
        // For price and duration fields, only allow numbers
        if (
          (activeField === "price" || activeField === "duration") &&
          !/^[0-9.]$/.test(key)
        ) {
          return;
        }
        // For price field, ensure only one decimal point
        if (activeField === "price" && key === "." && field.includes(".")) {
          return;
        }
        setter(field + key);
      }
    };

    const currentValue = formData[activeField].toString();
    updateField(currentValue, (newValue) => {
      setFormData((prev) => ({
        ...prev,
        [activeField]:
          activeField === "price" || activeField === "duration"
            ? Number(newValue) || 0
            : newValue,
      }));
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "duration" ? Number(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
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
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onFocus={() => setActiveField("description")}
            required
            rows={4}
            className="border-pink-200"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              onFocus={() => setActiveField("price")}
              required
              className="border-pink-200"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="0"
              value={formData.duration}
              onChange={handleChange}
              onFocus={() => setActiveField("duration")}
              required
              className="border-pink-200"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleSelectChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hair">Hair</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="nails">Nails</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
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
