"use client";

import type React from "react";

import { useState } from "react";
import { useServices } from "@/context/service-context";
import {
  type ServiceItem,
  type ServiceCategory,
  CATEGORY_LABELS,
} from "@/types/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

type ServiceFormData = {
  name: string;
  description: string;
  price: string;
  duration: string;
  category: ServiceCategory;
  active: boolean;
};

const initialFormData: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  duration: "",
  category: "facials",
  active: true,
};

const categoryOptions: { value: ServiceCategory; label: string }[] =
  Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ServiceCategory,
    label,
  }));

export default function ServiceManagement() {
  const { services, addService, updateService, deleteService } = useServices();
  const [activeTab, setActiveTab] = useState<ServiceCategory>("facials");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<ServiceFormData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<
    "name" | "description" | "price" | "duration" | null
  >(null);

  // Map _id to id for UI compatibility
  const mappedServices: ServiceItem[] = services.map((service: any) => ({
    ...service,
    id: service._id || service.id,
    category: service.category as ServiceCategory,
    price: Number(service.price),
    duration: service.duration ? Number(service.duration) : undefined,
    active: Boolean(service.active),
  }));

  const resetForm = () => {
    setFormData({ ...initialFormData, category: activeTab });
    setFormErrors({});
    setShowKeyboard(false);
    setActiveField(null);
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
        // For price and duration fields, only allow numbers and decimal points
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
        [activeField]: newValue, // Keep as string for consistency
      }));
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (formErrors[name as keyof ServiceFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value as ServiceCategory }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<ServiceFormData> = {};

    if (!formData.name.trim()) errors.name = "Name is required";

    // Handle string type for price (already a string)
    const priceValue = formData.price.trim();
    if (!priceValue || priceValue === "0") {
      errors.price = "Price is required";
    } else if (
      isNaN(Number.parseFloat(priceValue)) ||
      Number.parseFloat(priceValue) < 0
    ) {
      errors.price = "Price must be a valid number";
    }

    // Handle string type for duration (already a string)
    if (formData.duration) {
      const durationValue = formData.duration.trim();
      if (
        isNaN(Number.parseInt(durationValue)) ||
        Number.parseInt(durationValue) <= 0
      ) {
        errors.duration = "Duration must be a valid number";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddService = () => {
    if (!validateForm()) return;

    addService({
      name: formData.name,
      description: formData.description || undefined,
      price: Number.parseFloat(formData.price) || 0,
      duration: formData.duration
        ? Number.parseInt(formData.duration) || 0
        : undefined,
      category: formData.category,
      active: formData.active,
    });

    toast.success(`${formData.name} has been added successfully`);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditService = () => {
    if (!currentServiceId || !validateForm()) return;
    console.log("[UI] handleEditService currentServiceId:", currentServiceId);
    updateService(currentServiceId, {
      name: formData.name,
      description: formData.description || undefined,
      price: Number.parseFloat(formData.price),
      duration: formData.duration
        ? Number.parseInt(formData.duration)
        : undefined,
      category: formData.category,
      active: formData.active,
    });
    toast.success(`${formData.name} has been updated successfully`);
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteService = () => {
    if (!currentServiceId) return;
    console.log("[UI] handleDeleteService currentServiceId:", currentServiceId);
    const serviceToDelete = mappedServices.find(
      (service) => service.id === currentServiceId
    );
    if (!serviceToDelete) return;
    deleteService(currentServiceId);
    toast.success(`${serviceToDelete.name} has been deleted`);
    setIsDeleteDialogOpen(false);
    setCurrentServiceId(null);
  };

  const openEditDialog = (service: ServiceItem) => {
    console.log("[UI] openEditDialog service:", service);
    setCurrentServiceId(service.id);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration ? service.duration.toString() : "",
      category: service.category,
      active: service.active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (serviceId: string) => {
    console.log("[UI] openDeleteDialog serviceId:", serviceId);
    setCurrentServiceId(serviceId);
    setIsDeleteDialogOpen(true);
  };

  const filteredServices = searchQuery
    ? mappedServices.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (service.description &&
            service.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      )
    : mappedServices.filter((service) => service.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services..."
            className="pl-8 border-pink-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={resetForm}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-pink-800">
                Add New Service or Product
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                Create a new service or product for your salon.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden py-4">
              <div
                className={`grid gap-6 h-full transition-all duration-300 ${showKeyboard ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
              >
                {/* Form Section */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl border border-pink-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-pink-800 flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Service Details
                      </h3>

                      {/* Keyboard Toggle Button */}
                      <Button
                        type="button"
                        variant={showKeyboard ? "default" : "outline"}
                        size="sm"
                        className={`transition-all duration-200 text-xs ${
                          showKeyboard
                            ? "bg-pink-600 hover:bg-pink-700 text-white"
                            : "border-pink-300 text-pink-600 hover:bg-pink-50"
                        }`}
                        onClick={() => setShowKeyboard(!showKeyboard)}
                      >
                        <span className="mr-1">⌨️</span>
                        {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid gap-1">
                        <Label
                          htmlFor="name"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Service Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("name")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.name
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="Enter service name"
                        />
                        {formErrors.name && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="description"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("description")}
                          className="resize-none border-pink-200 focus:border-pink-500 text-sm"
                          rows={2}
                          placeholder="Enter service description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label
                            htmlFor="price"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Price (£)
                          </Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleInputChange}
                            onFocus={() => setActiveField("price")}
                            className={`transition-all duration-200 h-8 text-sm ${
                              formErrors.price
                                ? "border-red-500 focus:border-red-500"
                                : "border-pink-200 focus:border-pink-500"
                            }`}
                            placeholder="0.00"
                          />
                          {formErrors.price && (
                            <p className="text-xs text-red-500 flex items-center mt-1">
                              <span className="mr-1">⚠️</span>
                              {formErrors.price}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-1">
                          <Label
                            htmlFor="duration"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Duration (mins, optional)
                          </Label>
                          <Input
                            id="duration"
                            name="duration"
                            type="number"
                            min="1"
                            value={formData.duration}
                            onChange={handleInputChange}
                            onFocus={() => setActiveField("duration")}
                            className={`transition-all duration-200 h-8 text-sm ${
                              formErrors.duration
                                ? "border-red-500 focus:border-red-500"
                                : "border-pink-200 focus:border-pink-500"
                            }`}
                            placeholder="30"
                          />
                          {formErrors.duration && (
                            <p className="text-xs text-red-500 flex items-center mt-1">
                              <span className="mr-1">⚠️</span>
                              {formErrors.duration}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="category"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Category
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger className="border-pink-200 focus:border-pink-500 h-8 text-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-pink-50 rounded-lg border border-pink-100">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="active"
                            checked={formData.active}
                            onCheckedChange={handleSwitchChange}
                            className="data-[state=checked]:bg-green-500 scale-90"
                          />
                          <Label
                            htmlFor="active"
                            className={`font-medium transition-colors text-sm ${
                              formData.active
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            {formData.active
                              ? "Active Service"
                              : "Inactive Service"}
                          </Label>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formData.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {formData.active ? "✓ Enabled" : "✗ Disabled"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keyboard Section - Only show when showKeyboard is true */}
                {showKeyboard && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200 shadow-sm h-full flex flex-col">
                      <div className="flex items-center justify-center mb-4">
                        <h3 className="text-base font-semibold text-pink-800 flex items-center">
                          <span className="mr-2">⌨️</span>
                          Virtual Keyboard
                        </h3>
                      </div>

                      {activeField && (
                        <div className="mb-3 p-2 bg-white rounded-lg border border-pink-200">
                          <p className="text-sm text-pink-700">
                            <span className="font-medium">Active Field:</span>{" "}
                            {activeField.charAt(0).toUpperCase() +
                              activeField.slice(1)}
                          </p>
                        </div>
                      )}

                      <div className="flex-1 flex items-center justify-center">
                        <div className="w-full">
                          <OnScreenKeyboard
                            onKeyPress={(key) => {
                              if (!activeField) return;
                              const currentValue = String(
                                formData[activeField] || ""
                              );
                              let newValue = currentValue;

                              if (key === "backspace") {
                                newValue = currentValue.slice(0, -1);
                              } else if (key === "space") {
                                newValue = currentValue + " ";
                              } else if (key === "clear") {
                                newValue = "";
                              } else {
                                if (
                                  (activeField === "price" ||
                                    activeField === "duration") &&
                                  !/^[0-9.]$/.test(key)
                                )
                                  return;
                                if (
                                  activeField === "price" &&
                                  key === "." &&
                                  currentValue.includes(".")
                                )
                                  return;
                                newValue = currentValue + key;
                              }

                              setFormData((prev) => ({
                                ...prev,
                                [activeField]: newValue,
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                Cancel
              </Button>
              <Button
                className="bg-pink-600 hover:bg-pink-700"
                onClick={handleAddService}
              >
                Add Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {searchQuery ? (
        <Card className="border-pink-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No services found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                        {service.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {service.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-pink-50 text-pink-800 hover:bg-pink-50"
                        >
                          {CATEGORY_LABELS[service.category as ServiceCategory]}
                        </Badge>
                      </TableCell>
                      <TableCell>£{service.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {service.duration ? `${service.duration} mins` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={service.active ? "default" : "outline"}
                          className={
                            service.active
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {service.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openEditDialog(service)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(service.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          defaultValue="facials"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ServiceCategory)}
        >
          <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-4">
            {categoryOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categoryOptions.map((category) => (
            <TabsContent
              key={category.value}
              value={category.value}
              className="m-0"
            >
              <Card className="border-pink-200">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-4 text-muted-foreground"
                          >
                            No services found in this category.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">
                              {service.name}
                              {service.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                  {service.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>£{service.price.toFixed(2)}</TableCell>
                            <TableCell>
                              {service.duration
                                ? `${service.duration} mins`
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={service.active ? "default" : "outline"}
                                className={
                                  service.active
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                }
                              >
                                {service.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(service)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(service.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-800">
              Edit Service
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              Update service or product information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden py-4">
            <div
              className={`grid gap-6 h-full transition-all duration-300 ${showKeyboard ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
            >
              {/* Form Section */}
              <div className="space-y-4 overflow-y-auto pr-2">
                <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl border border-pink-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-pink-800 flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Service Details
                    </h3>

                    {/* Keyboard Toggle Button */}
                    <Button
                      type="button"
                      variant={showKeyboard ? "default" : "outline"}
                      size="sm"
                      className={`transition-all duration-200 text-xs ${
                        showKeyboard
                          ? "bg-pink-600 hover:bg-pink-700 text-white"
                          : "border-pink-300 text-pink-600 hover:bg-pink-50"
                      }`}
                      onClick={() => setShowKeyboard(!showKeyboard)}
                    >
                      <span className="mr-1">⌨️</span>
                      {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label
                        htmlFor="edit-name"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Service Name
                      </Label>
                      <Input
                        id="edit-name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("name")}
                        className={`transition-all duration-200 h-8 text-sm ${
                          formErrors.name
                            ? "border-red-500 focus:border-red-500"
                            : "border-pink-200 focus:border-pink-500"
                        }`}
                        placeholder="Enter service name"
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-500 flex items-center mt-1">
                          <span className="mr-1">⚠️</span>
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <Label
                        htmlFor="edit-description"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="edit-description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("description")}
                        className="resize-none border-pink-200 focus:border-pink-500 text-sm"
                        rows={2}
                        placeholder="Enter service description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label
                          htmlFor="edit-price"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Price (£)
                        </Label>
                        <Input
                          id="edit-price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("price")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.price
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="0.00"
                        />
                        {formErrors.price && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.price}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="edit-duration"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Duration (mins, optional)
                        </Label>
                        <Input
                          id="edit-duration"
                          name="duration"
                          type="number"
                          min="1"
                          value={formData.duration}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("duration")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.duration
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="30"
                        />
                        {formErrors.duration && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.duration}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label
                        htmlFor="edit-category"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Category
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={handleSelectChange}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500 h-8 text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-pink-50 rounded-lg border border-pink-100">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-active"
                          checked={formData.active}
                          onCheckedChange={handleSwitchChange}
                          className="data-[state=checked]:bg-green-500 scale-90"
                        />
                        <Label
                          htmlFor="edit-active"
                          className={`font-medium transition-colors text-sm ${
                            formData.active ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {formData.active
                            ? "Active Service"
                            : "Inactive Service"}
                        </Label>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          formData.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formData.active ? "✓ Enabled" : "✗ Disabled"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyboard Section - Only show when showKeyboard is true */}
              {showKeyboard && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <h3 className="text-base font-semibold text-pink-800 flex items-center">
                        <span className="mr-2">⌨️</span>
                        Virtual Keyboard
                      </h3>
                    </div>

                    {activeField && (
                      <div className="mb-3 p-2 bg-white rounded-lg border border-pink-200">
                        <p className="text-sm text-pink-700">
                          <span className="font-medium">Active Field:</span>{" "}
                          {activeField.charAt(0).toUpperCase() +
                            activeField.slice(1)}
                        </p>
                      </div>
                    )}

                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full">
                        <OnScreenKeyboard
                          onKeyPress={(key) => {
                            if (!activeField) return;
                            const currentValue = String(
                              formData[activeField] || ""
                            );
                            let newValue = currentValue;

                            if (key === "backspace") {
                              newValue = currentValue.slice(0, -1);
                            } else if (key === "space") {
                              newValue = currentValue + " ";
                            } else if (key === "clear") {
                              newValue = "";
                            } else {
                              if (
                                (activeField === "price" ||
                                  activeField === "duration") &&
                                !/^[0-9.]$/.test(key)
                              )
                                return;
                              if (
                                activeField === "price" &&
                                key === "." &&
                                currentValue.includes(".")
                              )
                                return;
                              newValue = currentValue + key;
                            }

                            setFormData((prev) => ({
                              ...prev,
                              [activeField]: newValue,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              Cancel
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={handleEditService}
            >
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteService}>
              Delete Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
