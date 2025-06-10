"use client";

import type React from "react";

import { useState } from "react";
import {
  useAuth,
  type User,
  type EmploymentType,
} from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type UserFormData = {
  name: string;
  username: string;
  email: string;
  role: "owner" | "therapist";
  active: boolean;
  password: string;
  confirmPassword: string;
  employmentType: EmploymentType;
  hourlyRate: string;
};

const initialFormData: UserFormData = {
  name: "",
  username: "",
  email: "",
  role: "therapist",
  active: true,
  password: "",
  confirmPassword: "",
  employmentType: "employed",
  hourlyRate: "",
};

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<
    | "name"
    | "username"
    | "email"
    | "password"
    | "confirmPassword"
    | "hourlyRate"
    | null
  >(null);

  // Filter users based on active tab
  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return user.active;
    if (activeTab === "inactive") return !user.active;
    return true;
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setShowKeyboard(false);
    setActiveField(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (formErrors[name as keyof UserFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";

    // Only validate password fields for new users or if password is being changed
    if (!currentUserId || formData.password) {
      if (!currentUserId && !formData.password)
        errors.password = "Password is required";
      if (formData.password && formData.password.length < 8)
        errors.password = "Password must be at least 8 characters";
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = "Passwords do not match";
    }

    // Validate hourly rate for employed therapists
    if (
      formData.employmentType === "employed" &&
      formData.role === "therapist"
    ) {
      // Handle both string and number types for hourlyRate
      const hourlyRateValue =
        typeof formData.hourlyRate === "string"
          ? formData.hourlyRate.trim()
          : formData.hourlyRate.toString();
      if (!hourlyRateValue || hourlyRateValue === "0") {
        errors.hourlyRate = "Hourly rate is required for employed therapists";
      } else if (
        isNaN(Number(hourlyRateValue)) ||
        Number(hourlyRateValue) <= 0
      ) {
        errors.hourlyRate = "Hourly rate must be a valid number greater than 0";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = () => {
    if (!validateForm()) return;

    // Check if username already exists
    if (
      users.some(
        (user) =>
          user.username &&
          user.username.toLowerCase() === formData.username.toLowerCase()
      )
    ) {
      setFormErrors((prev) => ({
        ...prev,
        username: "Username already exists",
      }));
      return;
    }

    addUser({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      active: formData.active,
      employmentType: formData.employmentType,
      hourlyRate:
        formData.employmentType === "employed" && formData.role === "therapist"
          ? Number(formData.hourlyRate)
          : undefined,
      password: formData.password,
    });

    toast.success(`${formData.name} has been added successfully`);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!currentUserId || !validateForm()) return;

    // Check if username already exists (excluding current user)
    if (
      users.some(
        (user) =>
          user._id !== currentUserId &&
          user.username &&
          user.username.toLowerCase() === formData.username.toLowerCase()
      )
    ) {
      setFormErrors((prev) => ({
        ...prev,
        username: "Username already exists",
      }));
      return;
    }

    updateUser(currentUserId, {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      active: formData.active,
      employmentType: formData.employmentType,
      hourlyRate:
        formData.employmentType === "employed" && formData.role === "therapist"
          ? Number(formData.hourlyRate)
          : undefined,
    });

    toast.success(`${formData.name} has been updated successfully`);
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteUser = () => {
    if (!currentUserId) return;

    const userToDelete = users.find((user) => user._id === currentUserId);
    if (!userToDelete) return;

    deleteUser(currentUserId);
    toast.success(`${userToDelete.name} has been deleted`);
    setIsDeleteDialogOpen(false);
    setCurrentUserId(null);
  };

  const openEditDialog = (user: User) => {
    setCurrentUserId(user._id ?? "");
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || "",
      role: user.role as "owner" | "therapist",
      active: user.active,
      password: "",
      confirmPassword: "",
      employmentType: user.employmentType || "employed",
      hourlyRate: user.hourlyRate ? user.hourlyRate.toString() : "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (userId: string | undefined) => {
    setCurrentUserId(userId ?? "");
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-pink-800">
          Therapist Accounts
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={resetForm}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Therapist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] max-h-[94vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-pink-800">
                Add New Therapist
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                Create a new account for a therapist. They'll be able to log in
                with these credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden py-1">
              <div
                className={`grid gap-6 h-full transition-all duration-300 ${showKeyboard ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
              >
                {/* Form Section */}
                <div className="space-y-3 overflow-y-auto pr-2">
                  <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl border border-pink-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-pink-800 flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Account Details
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
                          style={{ height: "32px" }}
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
                          htmlFor="username"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Username
                        </Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("username")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.username
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="Enter username"
                          style={{ height: "32px" }}
                        />
                        {formErrors.username && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.username}
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
                          style={{ height: "32px" }}
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label
                            htmlFor="password"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Password
                          </Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onFocus={() => setActiveField("password")}
                            className={`transition-all duration-200 h-8 text-sm ${
                              formErrors.password
                                ? "border-red-500 focus:border-red-500"
                                : "border-pink-200 focus:border-pink-500"
                            }`}
                            placeholder="Enter password"
                          />
                          {formErrors.password && (
                            <p className="text-xs text-red-500 flex items-center mt-1">
                              <span className="mr-1">⚠️</span>
                              {formErrors.password}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-1">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Confirm Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            onFocus={() => setActiveField("confirmPassword")}
                            className={`transition-all duration-200 h-8 text-sm ${
                              formErrors.confirmPassword
                                ? "border-red-500 focus:border-red-500"
                                : "border-pink-200 focus:border-pink-500"
                            }`}
                            placeholder="Confirm password"
                          />
                          {formErrors.confirmPassword && (
                            <p className="text-xs text-red-500 flex items-center mt-1">
                              <span className="mr-1">⚠️</span>
                              {formErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label
                            htmlFor="role"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Role
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              handleSelectChange("role", value)
                            }
                          >
                            <SelectTrigger className="border-pink-200 focus:border-pink-500 h-8 text-sm">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="therapist">
                                Therapist
                              </SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-1">
                          <Label
                            htmlFor="employmentType"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Employment Type
                          </Label>
                          <Select
                            value={formData.employmentType}
                            onValueChange={(value) =>
                              handleSelectChange(
                                "employmentType",
                                value as EmploymentType
                              )
                            }
                          >
                            <SelectTrigger className="border-pink-200 focus:border-pink-500 h-8 text-sm">
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="self-employed">
                                Self-Employed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {formData.employmentType === "employed" &&
                        formData.role === "therapist" && (
                          <div className="grid gap-1">
                            <Label
                              htmlFor="hourlyRate"
                              className="text-pink-700 font-medium text-sm"
                            >
                              Hourly Rate (£)
                            </Label>
                            <Input
                              id="hourlyRate"
                              name="hourlyRate"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.hourlyRate}
                              onChange={handleInputChange}
                              onFocus={() => setActiveField("hourlyRate")}
                              className={`transition-all duration-200 h-8 text-sm ${
                                formErrors.hourlyRate
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-pink-200 focus:border-pink-500"
                              }`}
                              placeholder="Enter hourly rate"
                            />
                            {formErrors.hourlyRate && (
                              <p className="text-xs text-red-500 flex items-center mt-1">
                                <span className="mr-1">⚠️</span>
                                {formErrors.hourlyRate}
                              </p>
                            )}
                          </div>
                        )}

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
                              ? "Active Account"
                              : "Inactive Account"}
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
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200 shadow-sm h-full flex flex-col">
                      <div className="flex items-center justify-center mb-6">
                        <h3 className="text-lg font-semibold text-pink-800 flex items-center">
                          <span className="mr-2">⌨️</span>
                          Virtual Keyboard
                        </h3>
                      </div>

                      {activeField && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-pink-200">
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
                                if (
                                  activeField === "hourlyRate" &&
                                  !/^[0-9.]$/.test(key)
                                )
                                  return;
                                if (
                                  activeField === "hourlyRate" &&
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
              >
                Cancel
              </Button>
              <Button
                className="bg-pink-600 hover:bg-pink-700"
                onClick={handleAddUser}
              >
                Add Therapist
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
            All Users
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
          <Card className="border-pink-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "owner" ? "default" : "outline"
                          }
                          className={
                            user.role === "owner"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              : "bg-pink-100 text-pink-800 hover:bg-pink-100"
                          }
                        >
                          {user.role === "owner" ? "Owner" : "Therapist"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.employmentType === "employed"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {user.employmentType === "employed"
                            ? "Employed"
                            : "Self-Employed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.active ? "default" : "outline"}
                          className={
                            user.active
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {user.active ? "Active" : "Inactive"}
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
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user._id ?? "")}
                              className="text-red-600 focus:text-red-600"
                              disabled={
                                user.role === "owner" &&
                                user.username === "Sarah"
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="m-0">
          <Card className="border-pink-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "owner" ? "default" : "outline"
                          }
                          className={
                            user.role === "owner"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              : "bg-pink-100 text-pink-800 hover:bg-pink-100"
                          }
                        >
                          {user.role === "owner" ? "Owner" : "Therapist"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.employmentType === "employed"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {user.employmentType === "employed"
                            ? "Employed"
                            : "Self-Employed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Active
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
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user._id ?? "")}
                              className="text-red-600 focus:text-red-600"
                              disabled={
                                user.role === "owner" &&
                                user.username === "Sarah"
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="m-0">
          <Card className="border-pink-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "owner" ? "default" : "outline"
                          }
                          className={
                            user.role === "owner"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              : "bg-pink-100 text-pink-800 hover:bg-pink-100"
                          }
                        >
                          {user.role === "owner" ? "Owner" : "Therapist"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.employmentType === "employed"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {user.employmentType === "employed"
                            ? "Employed"
                            : "Self-Employed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-800 hover:bg-gray-100"
                        >
                          Inactive
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
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user._id ?? "")}
                              className="text-red-600 focus:text-red-600"
                              disabled={
                                user.role === "owner" &&
                                user.username === "Sarah"
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-800">
              Edit Therapist
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              Update account information for this therapist.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden py-2">
            <div
              className={`grid gap-6 h-full transition-all duration-300 ${showKeyboard ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
            >
              {/* Form Section */}
              <div className="space-y-4 overflow-y-auto pr-2">
                <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl border border-pink-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-pink-800 flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Account Details
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
                        htmlFor="edit-username"
                        className="text-pink-700 font-medium text-sm"
                      >
                        Username
                      </Label>
                      <Input
                        id="edit-username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("username")}
                        className={`transition-all duration-200 h-8 text-sm ${
                          formErrors.username
                            ? "border-red-500 focus:border-red-500"
                            : "border-pink-200 focus:border-pink-500"
                        }`}
                        placeholder="Enter username"
                      />
                      {formErrors.username && (
                        <p className="text-xs text-red-500 flex items-center mt-1">
                          <span className="mr-1">⚠️</span>
                          {formErrors.username}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label
                          htmlFor="edit-password"
                          className="text-pink-700 font-medium text-sm"
                        >
                          New Password (optional)
                        </Label>
                        <Input
                          id="edit-password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("password")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.password
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="Leave blank to keep current"
                        />
                        {formErrors.password && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.password}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="edit-confirmPassword"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Confirm New Password
                        </Label>
                        <Input
                          id="edit-confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          onFocus={() => setActiveField("confirmPassword")}
                          className={`transition-all duration-200 h-8 text-sm ${
                            formErrors.confirmPassword
                              ? "border-red-500 focus:border-red-500"
                              : "border-pink-200 focus:border-pink-500"
                          }`}
                          placeholder="Confirm new password"
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-xs text-red-500 flex items-center mt-1">
                            <span className="mr-1">⚠️</span>
                            {formErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label
                          htmlFor="edit-role"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Role
                        </Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) =>
                            handleSelectChange("role", value)
                          }
                          disabled={formData.username === "Sarah"}
                        >
                          <SelectTrigger className="border-pink-200 focus:border-pink-500 h-8 text-sm">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="therapist">Therapist</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1">
                        <Label
                          htmlFor="edit-employmentType"
                          className="text-pink-700 font-medium text-sm"
                        >
                          Employment Type
                        </Label>
                        <Select
                          value={formData.employmentType}
                          onValueChange={(value) =>
                            handleSelectChange(
                              "employmentType",
                              value as EmploymentType
                            )
                          }
                        >
                          <SelectTrigger className="border-pink-200 focus:border-pink-500 h-8 text-sm">
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self-employed">
                              Self-Employed
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.employmentType === "employed" &&
                      formData.role === "therapist" && (
                        <div className="grid gap-1">
                          <Label
                            htmlFor="edit-hourlyRate"
                            className="text-pink-700 font-medium text-sm"
                          >
                            Hourly Rate (£)
                          </Label>
                          <Input
                            id="edit-hourlyRate"
                            name="hourlyRate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.hourlyRate}
                            onChange={handleInputChange}
                            onFocus={() => setActiveField("hourlyRate")}
                            className={`transition-all duration-200 h-8 text-sm ${
                              formErrors.hourlyRate
                                ? "border-red-500 focus:border-red-500"
                                : "border-pink-200 focus:border-pink-500"
                            }`}
                            placeholder="Enter hourly rate"
                          />
                          {formErrors.hourlyRate && (
                            <p className="text-xs text-red-500 flex items-center mt-1">
                              <span className="mr-1">⚠️</span>
                              {formErrors.hourlyRate}
                            </p>
                          )}
                        </div>
                      )}

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
                            ? "Active Account"
                            : "Inactive Account"}
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
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-center mb-6">
                      <h3 className="text-lg font-semibold text-pink-800 flex items-center">
                        <span className="mr-2">⌨️</span>
                        Virtual Keyboard
                      </h3>
                    </div>

                    {activeField && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-pink-200">
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
                              if (
                                activeField === "hourlyRate" &&
                                !/^[0-9.]$/.test(key)
                              )
                                return;
                              if (
                                activeField === "hourlyRate" &&
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
            >
              Cancel
            </Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700"
              onClick={handleEditUser}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this therapist account? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
