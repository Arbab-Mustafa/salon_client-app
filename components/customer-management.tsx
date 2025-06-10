"use client";

import type React from "react";

import { useState } from "react";
import { useCustomers } from "@/context/customer-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Search,
  FileText,
  Copy,
  ClipboardCheck,
  Eye,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Customer } from "@/types/customer";

type CustomerFormData = {
  name: string;
  mobile: string;
  email: string;
  notes: string;
  active: boolean;
};

const initialFormData: CustomerFormData = {
  name: "",
  mobile: "",
  email: "",
  notes: "",
  active: true,
};

export default function CustomerManagement() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } =
    useCustomers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formErrors, setFormErrors] = useState<Partial<CustomerFormData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<
    "name" | "mobile" | "email" | "notes" | null
  >(null);

  const resetForm = () => {
    setFormData(initialFormData);
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
        // For mobile field, only allow numbers and spaces
        if (activeField === "mobile" && !/^[0-9\s]$/.test(key)) {
          return;
        }
        setter(field + key);
      }
    };

    const currentValue = formData[activeField];
    updateField(currentValue, (newValue) => {
      setFormData((prev) => ({
        ...prev,
        [activeField]: newValue,
      }));
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (formErrors[name as keyof CustomerFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<CustomerFormData> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.mobile.trim()) errors.mobile = "Mobile number is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomer = async () => {
    if (!validateForm()) return;
    await addCustomer({
      name: formData.name,
      phone: formData.mobile,
      mobile: formData.mobile,
      email: formData.email,
      notes: formData.notes || undefined,
      active: formData.active,
    });
    toast.success(`${formData.name} has been added successfully`);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditCustomer = async () => {
    if (!currentCustomerId || !validateForm()) return;
    await updateCustomer(currentCustomerId, {
      name: formData.name,
      phone: formData.mobile,
      mobile: formData.mobile,
      email: formData.email,
      notes: formData.notes || undefined,
      active: formData.active,
    });
    toast.success(`${formData.name} has been updated successfully`);
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteCustomer = () => {
    if (!currentCustomerId) return;

    const customerToDelete = customers.find(
      (customer) => customer.id === currentCustomerId
    );
    if (!customerToDelete) return;

    deleteCustomer(currentCustomerId);
    toast.success(`${customerToDelete.name} has been deleted`);
    setIsDeleteDialogOpen(false);
    setCurrentCustomerId(null);
  };

  const openEditDialog = (customer: Customer) => {
    setCurrentCustomerId(customer.id);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      notes: customer.notes || "",
      active: customer.active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (customerId: string) => {
    setCurrentCustomerId(customerId);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (customer: Customer) => {
    setCurrentCustomerId(customer.id);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      notes: customer.notes || "",
      active: customer.active,
    });
    setIsViewDialogOpen(true);
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const sendConsultationFormEmail = (customer: Customer) => {
    const formLink = `${window.location.origin}/consultation-form/${customer.id}`;
    const subject = encodeURIComponent(
      `Your Consultation Form - ${customer.name}`
    );
    const body = encodeURIComponent(
      `Dear ${customer.name},\n\n` +
        `Thank you for choosing our services. To ensure we provide you with the best possible care, we need you to complete two important forms:\n\n` +
        `1. Consultation Form:\n` +
        `This form helps us understand your skin type, concerns, medical history, and preferences. This information is crucial for us to customize your treatment plan and ensure your safety.\n\n` +
        `2. Health & Safety Form:\n` +
        `For your safety and the safety of our staff, please also complete our Health & Safety and Allergies form:\n` +
        `https://docs.google.com/forms/d/e/1FAIpQLSfazPqYTUx06tVCnhQRjXD_nVk29xd8xevTBoz9RCFkpDHdSg/viewform?usp=send_form\n\n` +
        `Please complete both forms before your appointment. This will help us:\n` +
        `• Understand your specific needs and concerns\n` +
        `• Ensure your safety during treatments\n` +
        `• Provide personalized recommendations\n` +
        `• Prepare for your visit efficiently\n\n` +
        `If you have any questions or need assistance, please don't hesitate to contact us.\n\n` +
        `Best regards,\n` +
        `Your Beauty Team`
    );

    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email)}&su=${subject}&body=${body}`;
    window.open(mailtoLink, "_blank");

    // Update the last consultation form date
    updateCustomer(customer.id, {
      lastConsultationFormDate: new Date(),
    });
  };

  const openDatePicker = (customerId: string, currentDate?: Date) => {
    setCurrentCustomerId(customerId);
    setSelectedDate(currentDate || new Date());
    setIsDatePickerOpen(true);
  };

  const updateConsultationDate = async () => {
    if (!currentCustomerId) return;

    try {
      await updateCustomer(currentCustomerId, {
        lastConsultationFormDate: selectedDate,
      });
      toast.success("Last consultation date updated successfully");
      setIsDatePickerOpen(false);
      setCurrentCustomerId(null);
    } catch (error) {
      toast.error("Failed to update consultation date");
    }
  };

  // Filter customers based on search query and active tab
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && customer.active;
    if (activeTab === "inactive") return matchesSearch && !customer.active;

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
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
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-pink-800">
                Add New Customer
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                Create a new customer record.
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
                        <UserPlus className="mr-2 h-4 w-4" />
                        Customer Details
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
                          Full Name
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
                          placeholder="Enter full name"
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
                          htmlFor="mobile"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Mobile Number
                        </Label>
                        <Input
                          id="mobile"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("mobile")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.mobile
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="Enter mobile number"
                        />
                        {formErrors.mobile && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.mobile}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="email"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("email")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.email
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="Enter email address"
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="notes"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Notes (Optional)
                        </Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("notes")}
                          className="resize-none border-pink-200 focus:border-pink-500 text-sm"
                          rows={2}
                          placeholder="Enter customer notes"
                        />
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
                              ? "Active Customer"
                              : "Inactive Customer"}
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
                              const currentValue = formData[activeField] || "";
                              let newValue = currentValue;

                              if (key === "backspace") {
                                newValue = currentValue.slice(0, -1);
                              } else if (key === "space") {
                                newValue = currentValue + " ";
                              } else if (key === "clear") {
                                newValue = "";
                              } else {
                                // For mobile field, only allow numbers and spaces
                                if (
                                  activeField === "mobile" &&
                                  !/^[0-9\s]$/.test(key)
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
                onClick={handleAddCustomer}
              >
                Add Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "all" | "active" | "inactive")
        }
      >
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800"
          >
            All Customers
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800"
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value="inactive"
            className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800"
          >
            Inactive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          <CustomerTable
            customers={filteredCustomers}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onView={openViewDialog}
            onSendForm={sendConsultationFormEmail}
          />
        </TabsContent>

        <TabsContent value="active" className="m-0">
          <CustomerTable
            customers={filteredCustomers}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onView={openViewDialog}
            onSendForm={sendConsultationFormEmail}
          />
        </TabsContent>

        <TabsContent value="inactive" className="m-0">
          <CustomerTable
            customers={filteredCustomers}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onView={openViewDialog}
            onSendForm={sendConsultationFormEmail}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-800">
              Edit Customer
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              Update customer information.
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
                      Edit Customer Details
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
                        Full Name
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
                        placeholder="Enter full name"
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
                        htmlFor="edit-mobile"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Mobile Number
                      </Label>
                      <Input
                        id="edit-mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("mobile")}
                        className={`transition-all duration-200 h-8 text-sm ${
                          formErrors.mobile
                            ? "border-red-500 focus:border-red-500"
                            : "border-pink-200 focus:border-pink-500"
                        }`}
                        placeholder="Enter mobile number"
                      />
                      {formErrors.mobile && (
                        <p className="text-xs text-red-500 flex items-center mt-1">
                          <span className="mr-1">⚠️</span>
                          {formErrors.mobile}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <Label
                        htmlFor="edit-email"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("email")}
                        className={`transition-all duration-200 h-8 text-sm ${
                          formErrors.email
                            ? "border-red-500 focus:border-red-500"
                            : "border-pink-200 focus:border-pink-500"
                        }`}
                        placeholder="Enter email address"
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-500 flex items-center mt-1">
                          <span className="mr-1">⚠️</span>
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <Label
                        htmlFor="edit-notes"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id="edit-notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("notes")}
                        className="resize-none border-pink-200 focus:border-pink-500 text-sm"
                        rows={2}
                        placeholder="Enter customer notes"
                      />
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
                            ? "Active Customer"
                            : "Inactive Customer"}
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
                            const currentValue = formData[activeField] || "";
                            let newValue = currentValue;

                            if (key === "backspace") {
                              newValue = currentValue.slice(0, -1);
                            } else if (key === "space") {
                              newValue = currentValue + " ";
                            } else if (key === "clear") {
                              newValue = "";
                            } else {
                              // For mobile field, only allow numbers and spaces
                              if (
                                activeField === "mobile" &&
                                !/^[0-9\s]$/.test(key)
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
              onClick={handleEditCustomer}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p>{formData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mobile
                </p>
                <div className="flex items-center gap-1">
                  <p>{formData.mobile}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      copyToClipboard(
                        formData.mobile,
                        "Mobile number copied to clipboard"
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy mobile number</span>
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <div className="flex items-center gap-1">
                  <p className="truncate max-w-[120px]">{formData.email}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      copyToClipboard(
                        formData.email,
                        "Email copied to clipboard"
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy email</span>
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={formData.active ? "default" : "outline"}
                className={
                  formData.active
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }
              >
                {formData.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {formData.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Notes
                </p>
                <p className="text-sm">{formData.notes}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Consultation Form
              </p>
              {currentCustomerId && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-pink-200"
                      onClick={() => {
                        const link = `${window.location.origin}/consultation-form/${currentCustomerId}`;
                        copyToClipboard(
                          link,
                          "Consultation form link copied to clipboard"
                        );
                      }}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Copy Form Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-pink-200"
                      onClick={() => {
                        if (currentCustomerId) {
                          const customer = customers.find(
                            (c) => c.id === currentCustomerId
                          );
                          if (customer) {
                            sendConsultationFormEmail(customer);
                          }
                        }
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email Form Link
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-pink-200"
                    >
                      <Link
                        href={`/consultation-form/${currentCustomerId}`}
                        target="_blank"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Form
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={() => {
                setIsViewDialogOpen(false);
                if (currentCustomerId) {
                  const customer = customers.find(
                    (c) => c.id === currentCustomerId
                  );
                  if (customer) {
                    openEditDialog(customer);
                  }
                }
              }}
            >
              Edit Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot
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
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Last Consultation Date</DialogTitle>
            <DialogDescription>
              Select the date for the last consultation form.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="consultation-date">Consultation Date</Label>
              <input
                id="consultation-date"
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Select consultation date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDatePickerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={updateConsultationDate}
            >
              Update Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onView: (customer: Customer) => void;
  onSendForm: (customer: Customer) => void;
}

function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onView,
  onSendForm,
}: CustomerTableProps) {
  const { updateLastConsultationFormDate } = useCustomers();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const openDatePicker = (customerId: string, currentDate?: Date) => {
    setCurrentCustomerId(customerId);
    setSelectedDate(currentDate || new Date());
    setIsDatePickerOpen(true);
  };

  const updateConsultationDate = async () => {
    if (!currentCustomerId) return;

    try {
      await updateLastConsultationFormDate(currentCustomerId, selectedDate);
      toast.success("Last consultation date updated successfully");
      setIsDatePickerOpen(false);
      setCurrentCustomerId(null);
    } catch (error) {
      toast.error("Failed to update consultation date");
      console.error("Error updating consultation date:", error);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Never";
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <>
      <Card className="border-pink-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Last Consultation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{customer.mobile}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(customer.lastVisit)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>
                          {formatDate(customer.lastConsultationFormDate)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            openDatePicker(
                              customer.id,
                              customer.lastConsultationFormDate
                                ? new Date(customer.lastConsultationFormDate)
                                : undefined
                            )
                          }
                        >
                          <Calendar className="h-3 w-3" />
                          <span className="sr-only">
                            Update consultation date
                          </span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={customer.active ? "default" : "outline"}
                        className={
                          customer.active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {customer.active ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => onView(customer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(customer)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onSendForm(customer)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Send Consultation Form
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(customer.id)}
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

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Last Consultation Date</DialogTitle>
            <DialogDescription>
              Select the date for the last consultation form.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="consultation-date">Consultation Date</Label>
              <input
                id="consultation-date"
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Select consultation date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDatePickerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={updateConsultationDate}
            >
              Update Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
